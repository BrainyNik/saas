import { useState } from "react";
import { Dialog, DialogTrigger, DialogContent } from "./ui/dialog";
import { Expand, Loader2 } from "lucide-react";
import { Button } from "./ui/button";

import SimpleBar from "simplebar-react";
import { Document, Page } from "react-pdf";
import { useToast } from "./ui/use-toast";
import { useResizeDetector } from "react-resize-detector";

interface PdfFullScreenProps {
  fileUrl: string;
}

const PdfFullScreen = ({ fileUrl }: PdfFullScreenProps) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const { toast } = useToast();
  const [numPages, setNumPages] = useState<number>();

  const { width, ref } = useResizeDetector();

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(v) => {
        if (!v) {
          setIsOpen(v);
        }
      }}
    >
      <DialogTrigger asChild onClick={() => setIsOpen(true)}>
        <Button
          aria-label="fullscreen button"
          className="gap-1.5"
          variant={"ghost"}
        >
          <Expand className="h-4 w-4 " />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-7xl w-full">
        <SimpleBar autoHide={false} className="max-h-[calc(100vh-10rem)] mt-6">
          <div ref={ref}>
            <Document
              className={"max-h-full"}
              file={fileUrl}
              loading={
                <div className="flex justify-center">
                  <Loader2 className="my-24 h-6 w-6 animate-spin" />
                </div>
              }
              onLoadError={() => {
                toast({
                  title: "Error in loading PDF",
                  description: "Please try again",
                  variant: "destructive",
                });
              }}
              onLoadSuccess={({ numPages }) => setNumPages(numPages)}
            >
              {new Array(numPages).fill(0).map((_, index) => (
                <Page
                  key={index}
                  pageNumber={index + 1}
                  width={width ? width : 1}
                />
              ))}
            </Document>
          </div>
        </SimpleBar>
      </DialogContent>
    </Dialog>
  );
};

export default PdfFullScreen;
