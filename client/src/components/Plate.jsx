export default function Plate({ children, large = false }) {
  return (
    <span className={`plate${large ? ' large' : ''}`}>
      {children}
    </span>
  );
}
