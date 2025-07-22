// Test Firebase connection
import { auth, db } from "../config/firebase";
import { collection, addDoc, getDocs } from "firebase/firestore";

// Test function to verify Firebase connection
export const testFirebaseConnection = async () => {
  try {
    console.log("🔥 Testing Firebase connection...");

    // Test Authentication
    console.log("Auth instance:", auth ? "✅ Connected" : "❌ Failed");

    // Test Firestore
    console.log("Firestore instance:", db ? "✅ Connected" : "❌ Failed");

    // Try to write a test document
    const testDoc = await addDoc(collection(db, "test"), {
      message: "Hello Firebase!",
      timestamp: new Date(),
      test: true,
    });

    console.log("✅ Test document created with ID:", testDoc.id);

    // Try to read test documents
    const querySnapshot = await getDocs(collection(db, "test"));
    console.log("✅ Found", querySnapshot.size, "test documents");

    console.log("🎉 Firebase connection successful!");
    return true;
  } catch (error) {
    console.error("❌ Firebase connection failed:", error);
    return false;
  }
};
