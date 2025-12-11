export default function StatusBadge({ status }) {
  const styles = {
    EXECUTED: "bg-green-100 text-green-700 border-green-200",
    REJECTED: "bg-red-100 text-red-700 border-red-200",
    PENDING: "bg-yellow-100 text-yellow-700 border-yellow-200",
  };

  const defaultStyle = "bg-gray-100 text-gray-700 border-gray-200";

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[status] || defaultStyle}`}>
      {status}
    </span>
  );
}