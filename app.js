import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  doc,
  setDoc,
  getDoc
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";
// Import fungsi caesar dari file kriptografi terpisah
import { caesar } from "./kriptografi.js";

/* ================= FIREBASE CONFIG ================= */
const firebaseConfig = {
  apiKey: "AIzaSyDD29-IuCAUpQ8dCmWcQoXbUYoEcoUCF7A",
  authDomain: "scraping-aqua-c856e.firebaseapp.com",
  projectId: "scraping-aqua-c856e",
  storageBucket: "scraping-aqua-c856e.firebasestorage.app",
  messagingSenderId: "685622666681",
  appId: "1:685622666681:web:08a83804bc2c8a23358268",
  measurementId: "G-2JKFZCB3MN"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let username = "";
let roomId = "";
let roomKey = 3;

/* ================= LOGIC FUNCTIONS ================= */

async function createRoom() {
  username = document.getElementById("username").value.trim();
  const keyInput = document.getElementById("roomKey").value;

  if (!username) return alert("Isi nama terlebih dahulu!");
  if (!keyInput || isNaN(keyInput)) return alert("Kunci harus berupa angka!");

  roomKey = parseInt(keyInput);

  // Buat kode dasar berbasis teks statis + angka agar pergeseran enkripsi terlihat jelas di database
  const rawRoomId = "ROOM" + Math.floor(10 + Math.random() * 90); 

  // ENKRIPSI kode tersebut untuk dijadikan ID Dokumen di Firebase (Misal: ROOM55 -> SPPN66 jika shift = 1)
  roomId = caesar(rawRoomId, roomKey);

  const encryptedKeyDescription = caesar(roomKey.toString(), roomKey);
  const encryptedTimestamp = caesar(Date.now().toString(), roomKey);

  try {
    await setDoc(doc(db, "rooms", roomId), {
      secureKey: encryptedKeyDescription,
      secureTime: encryptedTimestamp
    });

    // Simpan kode asli ke memori browser untuk ditampilkan di UI chat
    window.originalRoomCode = rawRoomId;

    openChat();
  } catch (error) {
    console.error("Gagal membuat room:", error);
  }
}

async function joinRoom() {
  username = document.getElementById("username").value.trim();
  const inputRoomId = document.getElementById("roomCode").value.trim().toUpperCase(); 
  const keyInput = document.getElementById("roomKey").value;

  if (!username || !inputRoomId || !keyInput) return alert("Lengkapi data login!");

  const inputKey = parseInt(keyInput);

  // Ubah kode input biasa menjadi versi enkripsi untuk dicocokkan dengan ID Dokumen di Firebase
  const encryptedSearchId = caesar(inputRoomId, inputKey);

  try {
    const roomSnap = await getDoc(doc(db, "rooms", encryptedSearchId));

    if (!roomSnap.exists()) {
      return alert("Room tidak ditemukan! Periksa kembali kode room atau kuncinya.");
    }

    const roomData = roomSnap.data();
    const decryptedKeyStr = caesar(roomData.secureKey, -inputKey);
    const validKey = parseInt(decryptedKeyStr);

    if (validKey === inputKey) {
      roomId = encryptedSearchId; 
      roomKey = inputKey;
      window.originalRoomCode = inputRoomId; 
      openChat();
    } else {
      alert("Kunci salah!");
    }
  } catch (error) {
    console.error("Gagal join room:", error);
  }
}

function openChat() {
  document.getElementById("homePage").style.display = "none";
  document.getElementById("chatPage").style.display = "flex";
  // Memakai kode asli di layar aplikasi agar mudah dibaca user
  document.getElementById("roomTitle").innerText = `Room: ${window.originalRoomCode}`;

  listenMessages();
}

async function sendMessage() {
  const msgInput = document.getElementById("message");
  const msg = msgInput.value.trim();

  if (!msg) return;

  const encrypted = caesar(msg, roomKey);
  msgInput.value = "";

  try {
    await addDoc(collection(db, "rooms", roomId, "messages"), {
      sender: username,
      text: encrypted,
      createdAt: Date.now()
    });
  } catch (error) {
    console.error("Gagal mengirim pesan:", error);
  }
}

function listenMessages() {
  const q = query(collection(db, "rooms", roomId, "messages"), orderBy("createdAt"));

  onSnapshot(q, (snapshot) => {
    const chatBox = document.getElementById("chatBox");
    chatBox.innerHTML = "";

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const decrypted = caesar(data.text, -roomKey);

      const div = document.createElement("div");
      div.classList.add("msg");

      if (data.sender === username) {
        div.classList.add("me");
      }

      const nameNode = document.createElement("b");
      nameNode.textContent = data.sender;

      const textNode = document.createTextNode(decrypted);

      div.appendChild(nameNode);
      div.appendChild(document.createElement("br"));
      div.appendChild(textNode);

      chatBox.appendChild(div);
    });

    chatBox.scrollTop = chatBox.scrollHeight;
  });
}

function copyRoomCode() {
  // Menyalin kode asli ke clipboard, bukan kode terenkripsi
  navigator.clipboard.writeText(window.originalRoomCode);
  alert("Room code berhasil disalin!");
}

/* ================= EVENT LISTENERS ================= */
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("btnCreateRoom").addEventListener("click", createRoom);
  document.getElementById("btnJoinRoom").addEventListener("click", joinRoom);
  document.getElementById("btnSendMessage").addEventListener("click", sendMessage);
  document.getElementById("btnCopyRoom").addEventListener("click", copyRoomCode);

  document.getElementById("message").addEventListener("keypress", function (e) {
    if (e.key === "Enter") {
      sendMessage();
    }
  });
});