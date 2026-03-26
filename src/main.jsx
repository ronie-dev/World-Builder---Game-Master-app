import { StrictMode, Component } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { ToastProvider } from './components/Toast.jsx'

class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(error, info) { console.error("App crash:", error, info); }
  render() {
    if (this.state.error) {
      return (
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"100vh", background:"#0d0b14", color:"#e8d5b7", fontFamily:"Georgia,serif", gap:16, padding:32 }}>
          <div style={{ fontSize:32 }}>⚠️</div>
          <div style={{ fontSize:18, fontWeight:700 }}>Something went wrong</div>
          <div style={{ fontSize:13, color:"#9a7fa0", maxWidth:600, textAlign:"center", wordBreak:"break-word" }}>{this.state.error.message}</div>
          <button onClick={()=>this.setState({error:null})} style={{ background:"#7c5cbf", border:"none", color:"#e8d5b7", borderRadius:8, padding:"10px 20px", cursor:"pointer", fontSize:14 }}>Try again</button>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <ToastProvider>
        <App />
      </ToastProvider>
    </ErrorBoundary>
  </StrictMode>,
)
