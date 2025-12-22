import { ethers } from "ethers";

const RPC_URL = import.meta.env.VITE_BSC_RPC_URL;
const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;

// ABI مصغّر يكفي للقراءة
const ABI = [
  {
    inputs: [
      { internalType: "string", name: "_idNumber", type: "string" },
      { internalType: "string", name: "_dateOfBirth", type: "string" },
    ],
    name: "getPassport",
    outputs: [
      { internalType: "string", name: "fullName", type: "string" },
      { internalType: "string", name: "motherName", type: "string" },
      { internalType: "string", name: "passportNumber", type: "string" },
      { internalType: "string", name: "gender", type: "string" },
      { internalType: "string", name: "dateOfBirth", type: "string" },
      { internalType: "string", name: "placeOfBirth", type: "string" },
      { internalType: "string", name: "issueDate", type: "string" },
      { internalType: "string", name: "expiryDate", type: "string" },
      { internalType: "string", name: "fingerprintHash", type: "string" },
      { internalType: "uint256", name: "sensorId", type: "uint256" },
      { internalType: "string", name: "photoUrl", type: "string" },
      { internalType: "bool", name: "active", type: "bool" },
    ],
    stateMutability: "view",
    type: "function",
  },
];

function getReadOnlyProvider() {
  if (!RPC_URL) throw new Error("Missing VITE_BSC_RPC_URL");
  return new ethers.JsonRpcProvider(RPC_URL);
}

export async function getPassportFromChain(idNumber, dateOfBirth) {
  if (!CONTRACT_ADDRESS) throw new Error("Missing VITE_CONTRACT_ADDRESS");

  const provider = getReadOnlyProvider();
  const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);

  // استدعاء العقد
  const result = await contract.getPassport(idNumber, dateOfBirth);

  // ethers v6 يرجع Array-like + named outputs
  const passport = {
    fullName: result.fullName,
    motherName: result.motherName,
    idNumber, // ما بيرجعها العقد، فبنحطها إحنا
    passportNumber: result.passportNumber,
    gender: result.gender,

    // لتتوافق مع كودك الحالي في PassportData
    dob: result.dateOfBirth,
    birthPlace: result.placeOfBirth,

    issueDate: result.issueDate,
    expiryDate: result.expiryDate,

    fingerprintHash: result.fingerprintHash,
    sensorId: result.sensorId?.toString?.() ?? String(result.sensorId),
    photoUrl: result.photoUrl,
    active: result.active,
  };

  return passport;
}
