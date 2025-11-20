const btn = document.getElementById('connectBtn');
if (btn) btn.addEventListener('click', connectWallet);
else console.warn('connectBtn مش لاقينه');


export function sayHello(name) {
  console.log(`Hello, ${name}!`);
}
const connectBtn = document.getElementById('connectBtn');

(async () => {
  const contractAddress = "0x9aBdC666C6886a571ab5EA5aA432aA7e82F38b0c";
  // === مثال ABI مبسّط - استبدل بالـ ABI الحقيقي لعقدك ===
  const exampleAbi = [
    // دالة قراءة: إرجاع بيانات مستخدم عن طريق عنوانه
    "function getUser(address user) view returns (string name, bytes fingerprintHash, uint256 timestamp)",
    // دالة كتابة: تسجيل بصمة (مثال)
    "function registerFingerprint(address user, bytes32 fingerprintHash) returns (bool)"
  ];
  // =====================================================

  // عناصر الواجهة
  const connectBtn = document.getElementById('connectBtn');
  const accountSpan = document.getElementById('account');
  const logEl = document.getElementById('log');
  const callReadBtn = document.getElementById('callRead');
  const callWriteBtn = document.getElementById('callWrite');

  // حالة
  let provider, signer, userAddress, contract;

  function log(msg) {
    const time = new Date().toLocaleTimeString();
    logEl.textContent = `[${time}] ${msg}\n` + logEl.textContent;
  }

  // تحقق من وجود محفظة
  function hasEthereum() {
    return typeof window.ethereum !== 'undefined';
  }

  async function connectWallet() {
    try {
      if (!hasEthereum()) {
        log("لم يتم العثور على محفظة (MetaMask). الرجاء تثبيت MetaMask.");
        alert("يرجى تثبيت MetaMask أو أي مزود Web3 آخر.");
        return;
      }

      // طلب صلاحية الحسابات
      provider = new ethers.providers.Web3Provider(window.ethereum, "any");
      await provider.send("eth_requestAccounts", []);
      signer = provider.getSigner();
      userAddress = await signer.getAddress();
      accountSpan.textContent = userAddress;
      log("متصل بالمحفظة: " + userAddress);

      // إنشاء كائن العقد
      contract = new ethers.Contract(contractAddress, exampleAbi, signer);
      log("تم تهيئة العقد (ABI مثال — استبدله بالـ ABI الحقيقي).");
      
      // الاستماع لتبدّل الحساب أو الشبكة
      window.ethereum.on("accountsChanged", (accounts) => {
        if (accounts.length === 0) {
          accountSpan.textContent = "غير متصل";
          log("تم فصل الحساب.");
        } else {
          accountSpan.textContent = accounts[0];
          log("تبدّل الحساب: " + accounts[0]);
        }
      });
      window.ethereum.on("chainChanged", (chainId) => {
        log("تبدّل الشبكة: " + chainId);
        // يُنصح بإعادة تحميل الصفحة أو التعامل حسب الحاجة
      });

    } catch (err) {
      console.error(err);
      log("خطأ عند محاولة الاتصال: " + (err.message || err));
    }
  }

  async function readUserData() {
    try {
      if (!contract) {
        log("العقد غير مهيأ. اضغط Connect أولاً.");
        return;
      }
      // مثال: قراءة بيانات المستخدم المتصل
      const addr = userAddress;
      log("طلب بيانات المستخدم لـ " + addr + " ...");
      // تلميح: إذا لم تتطابق دالة getUser مع ABI الخاص بك، استبدلها بالاسم الصحيح
      const res = await contract.getUser(addr);
      // افتراض نموذج الإرجاع: [name, fingerprintHash, timestamp]
      log("تمت القراءة: " + JSON.stringify({
        name: res[0],
        fingerprintHash: ethers.utils.hexlify(res[1]),
        timestamp: res[2].toString()
      }));
    } catch (err) {
      console.error(err);
      log("خطأ في قراءة البيانات: " + (err.message || err));
    }
  }

  async function writeRegisterFingerprint() {
    try {
      if (!contract || !signer) {
        log("قم بالاتصال بالمحفظة أولاً.");
        return;
      }
      // مثال: نحسب هاش لبصمة (عادةً تأتيك من جهاز البصمة كـ hash أو bytes)
      // هنا نستخدم hash تجريبي من نص
      const demoFingerprint = "user-demo-fingerprint-bytes";
      const fingerprintHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(demoFingerprint));
      log("تحضير تسجيل البصمة (هاش): " + fingerprintHash);

      // تنفيذ المعاملة
      const tx = await contract.registerFingerprint(userAddress, fingerprintHash);
      log("تم إرسال المعاملة. هاش TX: " + tx.hash);
      // انتظر التأكيد
      const receipt = await tx.wait();
      log("تم تأكيد المعاملة. بلوك: " + receipt.blockNumber);
    } catch (err) {
      console.error(err);
      log("خطأ في تسجيل البصمة: " + (err.message || err));
    }
  }

  // ربط الأحداث
  connectBtn.addEventListener('click', connectWallet);
  callReadBtn.addEventListener('click', readUserData);
  callWriteBtn.addEventListener('click', writeRegisterFingerprint);

  // اختياري: إذا كان MetaMask مفتوحاً ومتصلًا بالفعل، نحاول الحصول على الحساب تلقائياً
  if (hasEthereum()) {
    try {
      provider = new ethers.providers.Web3Provider(window.ethereum, "any");
      const accounts = await provider.listAccounts();
      if (accounts.length > 0) {
        signer = provider.getSigner();
        userAddress = accounts[0];
        accountSpan.textContent = userAddress;
        contract = new ethers.Contract(contractAddress, exampleAbi, signer);
        log("الاكتشاف التلقائي: محفظة متصلة: " + userAddress);
      }
    } catch(e) {
      // تجاهل الأخطاء الصامتة هنا
    }
  } else {
    log("لا يوجد مزود Ethereum في المتصفح.");
  }
})();

