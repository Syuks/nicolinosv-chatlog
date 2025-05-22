import React, { useState } from "react"

interface DateSearchProps {
    onDateScroll: (date: string) => void
    availableDates: string[]
    defaultDate?: string
}

const DateSearch: React.FC<DateSearchProps> = ({
    onDateScroll,
    availableDates,
    defaultDate = "",
}) => {
    const [selectedDate, setSelectedDate] = useState<string>(defaultDate)

    // Update selectedDate when defaultDate changes
    React.useEffect(() => {
        if (defaultDate && !selectedDate) {
            setSelectedDate(defaultDate)
            // Automatically scroll to the first date when component mounts
            onDateScroll(defaultDate)
        }
    }, [defaultDate, selectedDate, onDateScroll])

    const handleDateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const date = e.target.value
        setSelectedDate(date)
        if (date) {
            onDateScroll(date)
        }
    }

    const handleGoToDate = () => {
        if (selectedDate) {
            onDateScroll(selectedDate)
        }
    }

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
            <label style={{ color: "#cccccc", fontSize: "0.9em", whiteSpace: "nowrap" }}>
                Fecha:
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
                <option value="">Select a date...</option>
                {availableDates.map((date) => (
                    <option key={date} value={date}>
                        {date}
                    </option>
                ))}
            </select>
            {selectedDate && (
                <button
                    onClick={handleGoToDate}
                    style={{
                        backgroundColor: "#4a7c59",
                        border: "none",
                        color: "white",
                        padding: "5px 12px",
                        borderRadius: "3px",
                        cursor: "pointer",
                        fontFamily: "inherit",
                        fontSize: "0.8em",
                    }}
                >
                    Ir
                </button>
            )}
            <span className="hide-mobile" style={{ color: "#888", fontSize: "0.85em" }}>
                {availableDates.length} fechas
            </span>
        </div>
    )
}

export default DateSearch
