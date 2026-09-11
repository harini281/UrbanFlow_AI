interface PlaceholderPageProps {
  title: string;
  eyebrow: string;
  description: string;
}

export default function PlaceholderPage({
  title,
  eyebrow,
  description,
}: PlaceholderPageProps) {
  return (
    <div className="placeholder-page">
      <div className="placeholder-icon">◆</div>

      <div className="placeholder-eyebrow">{eyebrow}</div>

      <h1>{title}</h1>

      <p>{description}</p>

      <div className="placeholder-status">
        <span className="status-dot" />
        DATA MODULE READY
      </div>
    </div>
  );
}
