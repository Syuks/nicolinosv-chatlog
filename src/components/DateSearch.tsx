import React, { useState } from "react";

interface DateSearchProps {
  onDateSearch: (date: string) => void;
  availableDates: string[];
}

const DateSearch: React.FC<DateSearchProps> = ({
  onDateSearch,
  availableDates,
}) => {
  const [selectedDate, setSelectedDate] = useState<string>("");

  const handleDateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const date = e.target.value;
    setSelectedDate(date);
    if (date) {
      onDateSearch(date);
    }
  };

  const handleClearDate = () => {
    setSelectedDate("");
    onDateSearch("");
  };

  return (
    <div
      style={{
        padding: "10px",
        backgroundColor: "#2a2a2a",
        border: "1px solid #333",
        borderRadius: "5px",
        marginBottom: "10px",
        display: "flex",
        alignItems: "center",
        gap: "10px",
        fontFamily: '"Lucida Console", "Consolas", "Monaco", monospace',
      }}
    >
      <label
        style={{ color: "#cccccc", fontSize: "0.9em", whiteSpace: "nowrap" }}
      >
        Filter by Date:
      </label>
      <select
        value={selectedDate}
        onChange={handleDateChange}
        style={{
          backgroundColor: "#333",
          border: "1px solid #555",
          color: "#cccccc",
          padding: "5px 8px",
          borderRadius: "3px",
          fontFamily: "inherit",
          fontSize: "0.9em",
          flex: "1",
          minWidth: "150px",
        }}
      >
        <option value="">All dates</option>
        {availableDates.map((date) => (
          <option key={date} value={date}>
            {date}
          </option>
        ))}
      </select>
      {selectedDate && (
        <button
          onClick={handleClearDate}
          style={{
            backgroundColor: "#555",
            border: "none",
            color: "white",
            padding: "5px 10px",
            borderRadius: "3px",
            cursor: "pointer",
            fontFamily: "inherit",
            fontSize: "0.8em",
          }}
        >
          Clear
        </button>
      )}
      <span style={{ color: "#888", fontSize: "0.85em" }}>
        {availableDates.length} dates available
      </span>
    </div>
  );
};

export default DateSearch;
