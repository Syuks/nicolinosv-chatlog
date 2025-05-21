import ChatDisplay from "./components/ChatDisplay";
import "./App.css";

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Nicolino SV Chat History</h1>
      </header>
      <main>
        <ChatDisplay />
      </main>
    </div>
  );
}

export default App;
