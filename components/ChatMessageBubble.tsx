import Link from "next/link";
import ReactMarkdown, { type Components } from "react-markdown";

const markdownComponents: Components = {
  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
  ul: ({ children }) => <ul className="mb-2 list-disc space-y-1 pl-4 last:mb-0">{children}</ul>,
  ol: ({ children }) => <ol className="mb-2 list-decimal space-y-1 pl-4 last:mb-0">{children}</ol>,
  li: ({ children }) => <li>{children}</li>,
  a: ({ href, children }) => {
    // Product/collection links from the store context are internal paths —
    // route them through next/link so the widget doesn't force a full reload.
    if (href?.startsWith("/")) {
      return (
        <Link href={href} className="font-medium text-rose underline hover:text-rose-dark">
          {children}
        </Link>
      );
    }
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className="font-medium text-rose underline hover:text-rose-dark">
        {children}
      </a>
    );
  },
};

export default function ChatMessageBubble({
  role,
  content,
}: {
  role: "user" | "assistant";
  content: string;
}) {
  return (
    <div
      className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
        role === "user" ? "ml-auto bg-rose text-white" : "bg-rose-soft text-foreground"
      }`}
    >
      {role === "user" ? (
        content
      ) : (
        <ReactMarkdown components={markdownComponents}>{content}</ReactMarkdown>
      )}
    </div>
  );
}
