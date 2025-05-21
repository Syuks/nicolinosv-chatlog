import React, { useEffect, useState } from "react";
import "./ChatDisplay.css"; // We'll create this CSS file next

export interface ParsedChatMessage {
  id: string; // Unique ID for React key
  fullDate: string; // MM/DD/YYYY
  time: string; // HH:MM:SS
  playerName: string;
  message: string;
  isTeamChat: boolean;
  isDead: boolean;
  rawLine: string; // Original line for debugging or fallback
}

const parseLogLine = (
  line: string,
  index: number
): ParsedChatMessage | null => {
  // Regex to capture: Date, Time, PlayerName, say/say_team, Message, (dead)
  // L 06/21/2020 - 21:34:02: "AmorDChat<16><STEAM_1:0:1238961968><CT>" say_team "subi"
  // L 06/21/2020 - 21:46:17: "fran<21><STEAM_ID_LAN><CT>" say_team "arriba" (dead)
  const regex =
    /^L (\d{2}\/\d{2}\/\d{4}) - (\d{2}:\d{2}:\d{2}): "([^<]+)<[^>]+><[^>]+><[^>]+>" (say|say_team) "(.*?)"(?:\s*\(dead\))?$/;
  const match = line.match(regex);

  if (match) {
    return {
      id: `msg-${index}-${new Date().getTime()}`, // Simple unique ID
      fullDate: match[1],
      time: match[2],
      playerName: match[3],
      isTeamChat: match[4] === "say_team",
      message: match[5],
      isDead: !!match[6] || line.trim().endsWith("(dead)"), // Check for the (dead) group or trailing text
      rawLine: line,
    };
  }
  console.warn("Could not parse line:", line);
  return null; // Or return a default structure for unparseable lines
};

const ChatDisplay: React.FC = () => {
  const [messages, setMessages] = useState<ParsedChatMessage[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAndParseLogs = async () => {
      try {
        setLoading(true);
        const response = await fetch("/all_chat_messages.log"); // Assuming it's in public folder
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const textData = await response.text();
        const lines = textData.split(/\r?\n/); // Split by new line

        const parsedMessages: ParsedChatMessage[] = lines
          .map((line, index) => parseLogLine(line, index))
          .filter((msg): msg is ParsedChatMessage => msg !== null); // Type guard to remove nulls

        setMessages(parsedMessages);
        setError(null);
      } catch (e) {
        console.error("Failed to load or parse chat logs:", e);
        if (e instanceof Error) {
          setError(
            `Failed to load chat logs: ${e.message}. Make sure 'all_chat_messages.log' is in the /public directory.`
          );
        } else {
          setError("An unknown error occurred while loading chat logs.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchAndParseLogs();
  }, []);

  if (loading) {
    return (
      <div className="chat-container loading">Loading chat messages...</div>
    );
  }

  if (error) {
    return <div className="chat-container error">Error: {error}</div>;
  }

  if (messages.length === 0) {
    return (
      <div className="chat-container empty">
        No chat messages found or parsed.
      </div>
    );
  }

  let lastDisplayedDate: string | null = null;

  return (
    <div className="chat-container cs16-chat">
      <ul className="message-list">
        {messages.map((msg) => {
          const showDateSeparator = msg.fullDate !== lastDisplayedDate;
          if (showDateSeparator) {
            lastDisplayedDate = msg.fullDate;
          }
          return (
            <React.Fragment key={msg.id}>
              {showDateSeparator && (
                <li className="day-separator">--- {msg.fullDate} ---</li>
              )}
              <li className="message-item">
                {msg.isDead && <span className="message-dead">*DEAD* </span>}
                {msg.isTeamChat && (
                  <span className="message-team-indicator">(TEAM) </span>
                )}
                <span className="message-player-name">{msg.playerName}</span>
                <span className="message-colon">: </span>
                <span className="message-text">{msg.message}</span>
                <span className="message-time">
                  {" "}
                  [{msg.time.substring(0, 5)}]
                </span>{" "}
                {/* Display HH:MM */}
              </li>
            </React.Fragment>
          );
        })}
      </ul>
    </div>
  );
};

export default ChatDisplay;
