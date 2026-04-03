import { useToastContext } from "./ToastContext.js";

function downloadImage(dataUrl) {
  const a = document.createElement("a");
  a.href = dataUrl;
  const mime = dataUrl.match(/data:image\/(\w+)/)?.[1] || "png";
  a.download = `image.${mime}`;
  a.click();
}

export default function Lightbox({ src, onClose }) {
  const { showToast } = useToastContext();

  if (!src) return null;

  const handleCopy = async (e) => {
    e.stopPropagation();
    try {
      const result = await window.electronAPI.copyImageToClipboard(src);
      if (result?.success) {
        showToast("Skopiowano obraz do schowka");
      } else {
        showToast("Nie udało się skopiować", "error");
      }
    } catch {
      showToast("Nie udało się skopiować", "error");
    }
  };

  const handleDownload = (e) => {
    e.stopPropagation();
    downloadImage(src);
    showToast("Pobieranie obrazu…", "info");
  };

  return (
    <div
      onClick={onClose}
      style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.92)", zIndex:500, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", cursor:"zoom-out" }}
    >
      <img
        src={src}
        alt=""
        style={{ maxWidth:"88vw", maxHeight:"80vh", borderRadius:10, boxShadow:"0 0 60px #000", userSelect:"none" }}
      />
      <div
        onClick={e => e.stopPropagation()}
        style={{ display:"flex", gap:10, marginTop:16 }}
      >
        <button
          onClick={handleCopy}
          style={{ background:"#1e1630", border:"1px solid #5a3da0", borderRadius:8, color:"#c8b89a", cursor:"pointer", fontSize:13, padding:"8px 18px" }}
        >
          📋 Kopiuj do schowka
        </button>
        <button
          onClick={handleDownload}
          style={{ background:"#1e1630", border:"1px solid #5a3da0", borderRadius:8, color:"#c8b89a", cursor:"pointer", fontSize:13, padding:"8px 18px" }}
        >
          💾 Pobierz
        </button>
        <button
          onClick={onClose}
          style={{ background:"none", border:"1px solid #3a2a5a", borderRadius:8, color:"#9a7fa0", cursor:"pointer", fontSize:13, padding:"8px 18px" }}
        >
          ✕ Zamknij
        </button>
      </div>
    </div>
  );
}
