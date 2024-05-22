import { db } from "@/db";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { createUploadthing, type FileRouter } from "uploadthing/next";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { pinecone } from "@/lib/pinecone";
import { OpenAIEmbeddings } from "@langchain/openai";
import { PineconeStore } from "@langchain/pinecone";

// Initialize the upload handler
const f = createUploadthing();

// Define the file router for handling PDF uploads
export const ourFileRouter = {
  pdfUploader: f({ pdf: { maxFileSize: "4MB" } })
    .middleware(async ({ req }) => {
      const { getUser } = getKindeServerSession();
      const user = await getUser();

      if (!user || !user.id) {
        throw new Error("Unauthorized");
      }

      return { userId: user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // Store file metadata in the database
      const createdFile = await db.file.create({
        data: {
          key: file.key,
          name: file.name,
          userId: metadata.userId,
          url: file.url,
          uploadStatus: "PROCESSING",
        },
      });

      try {
        // Fetch the uploaded PDF file
        const response = await fetch(file.url);
        const blob = await response.blob();

        // Load the PDF into memory
        const loader = new PDFLoader(blob);
        console.log("PDF loaded into memory");

        const pageLevelDocs = await loader.load();
        console.log("PDF pages extracted:", pageLevelDocs.length);

        // Initialize Pinecone index and embeddings
        const pineconeIndex = pinecone.Index("zippy");
        console.log("Pinecone index initialized");

        const embeddings = new OpenAIEmbeddings({
          openAIApiKey: process.env.OPENAI_API_KEY!,
        });
        console.log("OpenAI embeddings initialized");

        // Store the document embeddings in Pinecone
        await PineconeStore.fromDocuments(pageLevelDocs, embeddings, {
          pineconeIndex,
          namespace: createdFile.id,
        });
        console.log("Document embeddings stored in Pinecone");

        // Update the file upload status to success
        await db.file.update({
          data: { uploadStatus: "SUCCESS" },
          where: { id: createdFile.id },
        });
        console.log("File upload status updated to SUCCESS");
      } catch (error) {
        console.error("Error processing file:", error);

        // Update the file upload status to failed
        await db.file.update({
          data: { uploadStatus: "FAILED" },
          where: { id: createdFile.id },
        });
        console.log("File upload status updated to FAILED");
      }
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
