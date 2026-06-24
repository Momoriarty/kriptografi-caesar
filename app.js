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

/* ================= CAESAR CIPHER ================= */
function caesar(text, shift) {
  let result = "";
  shift = ((shift % 26) + 26) % 26;
  for (let c of text) {
    if (c >= "A" && c <= "Z") {
      result += String.fromCharCode((c.charCodeAt(0) - 65 + shift) % 26 + 65);
    } else if (c >= "a" && c <= "z") {
      result += String.fromCharCode((c.charCodeAt(0) - 97 + shift) % 26 + 97);
    } else {
      result += c;
    }
  }
  return result;
}

/* ================= LOGIC FUNCTIONS ================= */

async function createRoom() {
  username = document.getElementById("username").value.trim();
  const keyInput = document.getElementById("roomKey").value;

  if (!username) return alert("Isi nama terlebih dahulu!");
  if (!keyInput || isNaN(keyInput)) return alert("Kunci harus berupa angka!");

  roomKey = parseInt(keyInput);
  roomId = Math.random().toString(36).substring(2, 8).toUpperCase();

  try {
    // Menyimpan data room baru ke cloud server Firestore
    await setDoc(doc(db, "rooms", roomId), {
      key: roomKey,
      createdAt: Date.now()
    });
    openChat();
  } catch (error) {
    console.error("Gagal create room:", error);
    alert("Gagal terhubung ke Firebase. Pastikan koneksi internet stabil.");
  }
}

async function joinRoom() {
  username = document.getElementById("username").value.trim();
  roomId = document.getElementById("roomCode").value.trim().toUpperCase();

  if (!username || !roomId) return alert("Lengkapi data room!");

  try {
    // Mengunduh validasi kode room langsung dari cloud server
    const roomSnap = await getDoc(doc(db, "rooms", roomId));

    if (!roomSnap.exists()) {
      return alert("Room tidak ditemukan! Periksa kembali kode room.");
    }

    roomKey = parseInt(roomSnap.data().key);
    openChat();
  } catch (error) {
    console.error("Gagal join room:", error);
    alert("Gagal masuk ke room. Periksa jaringan internet Anda.");
  }
}

function openChat() {
  document.getElementById("homePage").style.display = "none";
  document.getElementById("chatPage").style.display = "flex";
  document.getElementById("roomTitle").innerText = `Room: ${roomId}`;

  listenMessages();
}

async function sendMessage() {
  const msgInput = document.getElementById("message");
  const msg = msgInput.value.trim();

  if (!msg) return;

  const encrypted = caesar(msg, roomKey);
  msgInput.value = ""; // Bersihkan kolom input segera

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
      const decrypted = caesar(data.text, -roomKey); // Dekripsi otomatis di sisi klien

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
  navigator.clipboard.writeText(roomId);
  alert("Room code berhasil disalin!");
}

/* ================= EVENT LISTENERS ================= */
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("btnCreateRoom").addEventListener("click", createRoom);
  document.getElementById("btnJoinRoom").addEventListener("click", joinRoom);
  document.getElementById("btnSendMessage").addEventListener("click", sendMessage);
  document.getElementById("btnCopyRoom").addEventListener("click", copyRoomCode);

  document.getElementById("message").addEventListener("keypress", function(e) {
    if (e.key === "Enter") {
      sendMessage();
    }
  });
});