import React, { useEffect, useState, useMemo, useCallback, useRef } from "react"
import { FixedSizeList as List } from "react-window"
import "./ChatDisplay.css"
import DateSearch from "./DateSearch"

export interface ParsedChatMessage {
    id: string
    fullDate: string
    time: string
    playerName: string
    message: string
    isTeamChat: boolean
    isDead: boolean
    team: "C" | "T" | "S" | ""
    rawLine: string
    isDateSeparator?: boolean
}

const parseLogLine = (line: string, index: number): ParsedChatMessage | null => {
    if (!line || line.trim() === "") return null

    const parts = line.split("¬")
    if (parts.length < 5) {
        console.warn("Line doesn't have enough parts:", line)
        return null
    }

    const fullDate = parts[0]
    const time = parts[1]

    const playerInfo = parts[2]
    const teamMatch = playerInfo.match(/(.*)<([CTS]?)>/)

    if (!teamMatch) {
        console.warn("Couldn't parse player info:", playerInfo)
        return null
    }

    const playerName = teamMatch[1]
    const team = teamMatch[2] as "C" | "T" | "S" | ""

    const sayOrSayTeam = parts[3] as "y" | "u"
    const isTeamChat = sayOrSayTeam === "u"

    const message = parts[4]
    const isDead = parts.length > 5 && parts[5] === "d"

    return {
        id: `msg-${index}-${new Date().getTime()}`,
        fullDate,
        time,
        playerName,
        message,
        isTeamChat,
        isDead,
        team,
        rawLine: line,
    }
}

interface MessageItemProps {
    index: number
    style: React.CSSProperties
    data: {
        messages: ParsedChatMessage[]
        searchTerm: string
        highlightedIndex: number
    }
}

const MessageItem: React.FC<MessageItemProps> = ({ index, style, data }) => {
    const { messages, searchTerm, highlightedIndex } = data
    const msg = messages[index]

    if (msg.isDateSeparator) {
        return (
            <div style={style} className="day-separator">
                --- {msg.fullDate} ---
            </div>
        )
    }

    const getPlayerNameClass = (team: string): string => {
        switch (team) {
            case "C":
                return "message-player-name message-player-name-ct"
            case "T":
                return "message-player-name message-player-name-t"
            case "S":
            default:
                return "message-player-name message-player-name-spec"
        }
    }

    const getTeamName = (team: string): string => {
        switch (team) {
            case "C":
                return "Counter-Terrorist"
            case "T":
                return "Terrorist"
            case "S":
            default:
                return "Spectator"
        }
    }

    const highlightText = (text: string, term: string): React.ReactNode => {
        if (!term) return text

        const regex = new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi")
        const parts = text.split(regex)

        return parts.map((part, i) =>
            regex.test(part) ? (
                <span key={i} className="highlighted-text">
                    {part}
                </span>
            ) : (
                part
            )
        )
    }

    const isHighlighted = index === highlightedIndex

    return (
        <div style={style} className={`message-item ${isHighlighted ? "highlighted" : ""}`}>
            <span className="message-time">[{msg.time.substring(0, 5)}]</span>
            <div className="message-content">
                {msg.isDead && <span className="message-dead">*DEAD*</span>}
                {!msg.isTeamChat && msg.team === "S" && (
                    <span className="message-team-indicator">*SPEC*</span>
                )}
                {msg.isTeamChat && (
                    <span className="message-team-indicator">({getTeamName(msg.team)})</span>
                )}
                <span className={getPlayerNameClass(msg.team)}>
                    {highlightText(msg.playerName, searchTerm)}
                </span>
                <span className="message-colon">:</span>
                <span className="message-text">{highlightText(msg.message, searchTerm)}</span>
            </div>
        </div>
    )
}

const ChatDisplay: React.FC = () => {
    const [allMessages, setAllMessages] = useState<ParsedChatMessage[]>([])
    const [loading, setLoading] = useState<boolean>(true)
    const [error, setError] = useState<string | null>(null)
    const [searchTerm, setSearchTerm] = useState<string>("")
    const [currentSearchIndex, setCurrentSearchIndex] = useState<number>(-1)
    const [searchResults, setSearchResults] = useState<number[]>([])

    const listRef = useRef<List>(null)

    useEffect(() => {
        const fetchAndParseLogs = async () => {
            try {
                setLoading(true)
                const response = await fetch("/chat_messages.txt")
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`)
                }
                const textData = await response.text()
                const lines = textData.split(/\r?\n/)

                const parsedMessages: ParsedChatMessage[] = lines
                    .map((line, index) => parseLogLine(line, index))
                    .filter((msg): msg is ParsedChatMessage => msg !== null)

                // Add date separators
                const messagesWithSeparators: ParsedChatMessage[] = []
                let lastDate: string | null = null

                parsedMessages.forEach((msg) => {
                    if (msg.fullDate !== lastDate) {
                        messagesWithSeparators.push({
                            id: `separator-${msg.fullDate}`,
                            fullDate: msg.fullDate,
                            time: "",
                            playerName: "",
                            message: "",
                            isTeamChat: false,
                            isDead: false,
                            team: "",
                            rawLine: "",
                            isDateSeparator: true,
                        })
                        lastDate = msg.fullDate
                    }
                    messagesWithSeparators.push(msg)
                })

                setAllMessages(messagesWithSeparators)
                setError(null)
            } catch (e) {
                console.error("Failed to load or parse chat logs:", e)
                if (e instanceof Error) {
                    setError(
                        `Failed to load chat logs: ${e.message}. Make sure 'optimized_chat_messages.log' is in the /public directory.`
                    )
                } else {
                    setError("An unknown error occurred while loading chat logs.")
                }
            } finally {
                setLoading(false)
            }
        }

        fetchAndParseLogs()
    }, [])

    // Get available dates for the date selector
    const availableDates = useMemo(() => {
        const dates = new Set<string>()
        allMessages.forEach((msg) => {
            if (!msg.isDateSeparator) {
                dates.add(msg.fullDate)
            }
        })

        // Sort dates chronologically (dd/mm/yyyy format)
        return Array.from(dates).sort((a, b) => {
            const [dayA, monthA, yearA] = a.split("/").map(Number)
            const [dayB, monthB, yearB] = b.split("/").map(Number)

            const dateA = new Date(yearA, monthA - 1, dayA)
            const dateB = new Date(yearB, monthB - 1, dayB)

            return dateA.getTime() - dateB.getTime()
        })
    }, [allMessages])

    // Perform search
    const performSearch = useCallback(() => {
        if (!searchTerm.trim()) {
            setSearchResults([])
            setCurrentSearchIndex(-1)
            return
        }

        const term = searchTerm.toLowerCase()
        const results: number[] = []

        allMessages.forEach((msg, index) => {
            if (msg.isDateSeparator) return

            const searchableText = `${msg.playerName} ${msg.message}`.toLowerCase()
            if (searchableText.includes(term)) {
                results.push(index)
            }
        })

        setSearchResults(results)
        setCurrentSearchIndex(results.length > 0 ? 0 : -1)

        // Scroll to the first result
        if (results.length > 0 && listRef.current) {
            listRef.current.scrollToItem(results[0], "center")
        }
    }, [searchTerm, allMessages])

    // Navigate search results
    const navigateSearch = useCallback(
        (direction: "next" | "prev") => {
            if (searchResults.length === 0) return

            let newIndex: number
            if (direction === "next") {
                newIndex =
                    currentSearchIndex >= searchResults.length - 1 ? 0 : currentSearchIndex + 1
            } else {
                newIndex =
                    currentSearchIndex <= 0 ? searchResults.length - 1 : currentSearchIndex - 1
            }

            setCurrentSearchIndex(newIndex)
            if (listRef.current) {
                listRef.current.scrollToItem(searchResults[newIndex], "center")
            }
        },
        [searchResults, currentSearchIndex]
    )

    // Handle search input
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value)
    }

    const handleSearchKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            performSearch()
        }
    }

    // Handle date scroll
    const handleDateScroll = (date: string) => {
        if (!date || !listRef.current) return

        // Find the index of the date separator for the selected date
        const dateIndex = allMessages.findIndex(
            (msg) => msg.isDateSeparator && msg.fullDate === date
        )

        if (dateIndex !== -1) {
            listRef.current.scrollToItem(dateIndex, "start")
        }
    }

    if (loading) {
        return <div className="chat-container loading">Loading chat messages...</div>
    }

    if (error) {
        return <div className="chat-container error">Error: {error}</div>
    }

    if (allMessages.length === 0) {
        return <div className="chat-container empty">No chat messages found or parsed.</div>
    }

    const currentHighlightedIndex =
        searchResults.length > 0 && currentSearchIndex >= 0 ? searchResults[currentSearchIndex] : -1

    return (
        <>
            <DateSearch
                onDateScroll={handleDateScroll}
                availableDates={availableDates}
                defaultDate={availableDates.length > 0 ? availableDates[0] : ""}
            />

            <div className="chat-container">
                <div className="search-controls">
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={handleSearchChange}
                        onKeyPress={handleSearchKeyPress}
                        placeholder="Buscar mensajes..."
                        className="search-input"
                    />
                    <button
                        onClick={performSearch}
                        className="search-button"
                        disabled={!searchTerm.trim()}
                    >
                        Buscar
                    </button>

                    {searchResults.length > 0 && (
                        <>
                            <div className="search-info">
                                {currentSearchIndex + 1} of {searchResults.length}
                            </div>
                            <div className="search-navigation">
                                <button
                                    onClick={() => navigateSearch("prev")}
                                    className="nav-button"
                                    disabled={searchResults.length <= 1}
                                >
                                    ↑
                                </button>
                                <button
                                    onClick={() => navigateSearch("next")}
                                    className="nav-button"
                                    disabled={searchResults.length <= 1}
                                >
                                    ↓
                                </button>
                            </div>
                        </>
                    )}
                </div>

                <List
                    ref={listRef}
                    className="virtualized-list"
                    width="100%"
                    height={500}
                    itemCount={allMessages.length}
                    itemSize={50}
                    itemData={{
                        messages: allMessages,
                        searchTerm,
                        highlightedIndex: currentHighlightedIndex,
                    }}
                >
                    {MessageItem}
                </List>
            </div>
        </>
    )
}

export default ChatDisplay
