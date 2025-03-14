import ChatWrapper from "@/components/ChatWrapper";
import PdfRenderer from "@/components/PdfRenderer";
import { db } from "@/db";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { notFound, redirect } from "next/navigation";
import React from "react";

interface PageProps {
  params: {
    fileid: string;
  };
}
const Page = async ({ params }: PageProps) => {
  // get file id from the url
  const { fileid: fileId } = params;

  const { getUser } = getKindeServerSession();
  const user = await getUser();

  if (!user || !user.id) redirect(`/auth-callback/dashboard/${fileId}`);

  // make databse call to retrieve the file

  const file = await db.file.findFirst({
    where: {
      id: fileId,
      userId: user.id,
    },
  });

  if (!file) notFound();

  return (
    <div className="flex-1 justify-between flex flex-col  ">
      <div className="mx-auto w-full max-w-8xl grow lg:flex xl:px-2  ">
        {/* pdf viewer */}
        <div className="flex-1 xl:flex  ">
          <div className="px-4 py-6 sm:px-6 lg:pl-8 xl:flex-1 xl:pl-6 ">
            <PdfRenderer url={file.url} />
          </div>
        </div>

        {/* chatting section */}
        <div className="shrink-0 flex-[0.75] border-t border-gray-200 lg:w-96 lg:border-l lg:border-t-0">
          <ChatWrapper fileId={file.id} />
        </div>
      </div>
    </div>
  );
};

export default Page;
