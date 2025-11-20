//App.jsx
import React, { useEffect, useState } from "react";
import "./App.css";
import planeLine from "./image/planeLine-removebg-preview.png";
import { useNavigate } from "react-router-dom";
import Header from "./Header";
import { BrowserProvider, Contract } from "ethers";

const CONTRACT_ADDRESS = "0x9aBdC666C6886a571ab5EA5aA432aA7e82F38b0c";
const CONTRACT_ABI = [/* ABI نفسه كالعادة */];

export default function App() {
  const navigate = useNavigate();

  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);

  // Connect Wallet (يظهر زرّه فقط هنا في الصفحة الرئيسية)
  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        alert("Please install MetaMask first");
        return;
      }
      const _provider = new BrowserProvider(window.ethereum);
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      const addr = accounts[0];
      const _signer = await _provider.getSigner();

      setProvider(_provider);
      setSigner(_signer);
      setAccount(addr);

      const _contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, _signer);
      setContract(_contract);

      console.log("Wallet connected:", addr);
    } catch (e) {
      console.error(e);
      alert(e?.message || "Error connecting wallet");
    }
  };

  // اكتشاف اتصال سابق
  useEffect(() => {
    if (!window.ethereum) return;
    const _provider = new BrowserProvider(window.ethereum);
    _provider.listAccounts().then(async (accs) => {
      if (accs.length > 0) {
        const _signer = await _provider.getSigner();
        setProvider(_provider);
        setSigner(_signer);
        setAccount(accs[0].address);
        setContract(new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, _signer));
      }
    });
  }, []);

  return (
    <div className="page">
      {/* Header (بدون زر المحفظة فيه) */}
      <Header />

      {/* زر المحفظة أعلى يمين الصفحة الرئيسية فقط */}
      <button className="wallet-chip" onClick={connectWallet}>
        {account ? `✅ ${account.slice(0, 6)}...${account.slice(-4)}` : "Connect Wallet"}
      </button>

      {/* المحتوى الرئيسي */}
      <main className="content fade-in">
        <img src={planeLine} alt="Plane Line" className="plane-line" />
        <h1 className="title">Explore the Future of Travel</h1>

        <div className="buttons-vertical">
          {/*<button className="btn primary" onClick={() => navigate("/newpassport")}>
            Create a New Passport
          </button>*/}
          {/*<button className="btn outline" onClick={() => navigate("/fingerprint-login")}>
            Login in with Fingerprint
          </button>*/}
        </div>

        {contract && account && (
          <div style={{ marginTop: 20, color: "#333" }}>
            <p>Connected address: {account}</p>
          </div>
        )}
      </main>
    </div>
  );
}
{/*/fingerprint-login*/}