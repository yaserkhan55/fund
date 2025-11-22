// src/pages/StartFundraiser.jsx
import { useEffect, useState, useRef } from "react";
import axios from "axios";

const PRIMARY = "#00AEEF";
const DARK = "#0077A3";

export default function StartFundraiser() {
  const token = localStorage.getItem("token");
  const [step, setStep] = useState(1);
  const [fundraiserId, setFundraiserId] = useState(null);
  const [saving, setSaving] = useState(false);
  const autosaveRef = useRef(null);

  const [data, setData] = useState({
    beneficiaryType: "self",
    category: "",
    beneficiary: {
      name: "",
      age: "",
      gender: "",
      relation: "",
      condition: "",
      hospital: "",
      city: ""
    },
    title: "",
    story: "",
    goalAmount: "",
    coverImage: null, // local File
    gallery: [],      // Files
    videoUrl: "",
    payout: {
      accountHolder: "",
      accountNumber: "",
      ifsc: "",
      bankName: "",
      panNumber: "",
      upiId: ""
    }
  });

  // create draft if not present
  useEffect(() => {
    const local = JSON.parse(localStorage.getItem("fundraiser-draft") || "null");
    if (local) {
      setData(local.data || data);
      setFundraiserId(local.id || null);
      setStep(local.step || 1);
    } else {
      // create backend draft
      createDraft();
    }

    // autosave every 12s to backend if id exists
    autosaveRef.current = setInterval(() => {
      if (fundraiserId) autosaveToBackend();
    }, 12000);

    return () => clearInterval(autosaveRef.current);
    // eslint-disable-next-line
  }, [fundraiserId]);

  // create draft backend
  async function createDraft() {
    try {
      const res = await axios.post("/api/fundraiser/draft", {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data && res.data.fundraiser) {
        setFundraiserId(res.data.fundraiser._id);
        localStorage.setItem("fundraiser-draft", JSON.stringify({ id: res.data.fundraiser._id, data, step }));
      }
    } catch (err) {
      // Error creating draft
    }
  }

  // autosave to backend
  async function autosaveToBackend() {
    setSaving(true);
    try {
      const payload = {
        beneficiaryType: data.beneficiaryType,
        category: data.category,
        beneficiary: data.beneficiary,
        title: data.title,
        story: data.story,
        goalAmount: Number(data.goalAmount) || 0,
        videoUrl: data.videoUrl,
        payout: data.payout
      };
      await axios.put(`/api/fundraiser/update/${fundraiserId}`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      localStorage.setItem("fundraiser-draft", JSON.stringify({ id: fundraiserId, data, step }));
    } catch (err) {
      // Autosave error
    } finally {
      setSaving(false);
    }
  }

  // upload files (cover/gallery/pan/cheque)
  async function uploadFiles(filesMap = {}) {
    if (!fundraiserId) return;
    const form = new FormData();
    if (filesMap.cover) form.append("cover", filesMap.cover);
    if (filesMap.gallery && filesMap.gallery.length) {
      filesMap.gallery.forEach(f => form.append("gallery", f));
    }
    if (filesMap.pan) form.append("pan", filesMap.pan);
    if (filesMap.cheque) form.append("cheque", filesMap.cheque);

    try {
      await axios.post(`/api/fundraiser/upload/${fundraiserId}`, form, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" }
      });
      // refresh backend snapshot (optional)
    } catch (err) {
      // Upload error
      throw err;
    }
  }

  // publish
  async function publish() {
    // quick client-side checks
    if (!data.title || data.title.length < 6) return alert("Enter a longer title");
    if (!data.story || data.story.length < 50) return alert("Write a detailed story (50+ chars)");
    if (!data.goalAmount || Number(data.goalAmount) <= 0) return alert("Set a goal amount");
    if (!fundraiserId) return alert("Draft not ready");

    // autodump some fields to backend
    try {
      await autosaveToBackend();
      await axios.post(`/api/fundraiser/publish/${fundraiserId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert("Fundraiser submitted for review / published!");
      // optionally redirect to campaign details
      window.location.href = `/campaign/${fundraiserId}`;
    } catch (err) {
      if (err.response && err.response.data && err.response.data.errors) {
        alert("Publish errors:\n" + err.response.data.errors.join("\n"));
      } else {
        alert("Publish failed. Please try again.");
      }
    }
  }

  // navigation helpers
  const next = () => setStep(s => Math.min(6, s+1));
  const prev = () => setStep(s => Math.max(1, s-1));
  const goto = (n) => setStep(n);

  // small step components:
  function StepHeader(){ return (
    <div className="mb-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold" style={{color:PRIMARY}}>Start a Fundraiser</h1>
        <div className="text-sm text-gray-600">{saving ? "Saving..." : "Auto-save on"}</div>
      </div>
      <div className="mt-3 h-2 bg-gray-100 rounded">
        <div style={{ width: `${(step/6)*100}%`, height: "8px", background: PRIMARY }} className="rounded"></div>
      </div>
    </div>
  );}

  function Step1(){
    return (
      <div className="space-y-4">
        <label className="font-semibold">Who is this fundraiser for?</label>
        <div className="flex gap-3">
          {["self","someone","organization"].map(opt => (
            <button
              key={opt}
              onClick={() => setData(d => ({...d, beneficiaryType: opt}))}
              className={`px-4 py-2 rounded-lg border ${data.beneficiaryType===opt ? "bg-[#00AEEF] text-white" : "bg-white"}`}
            >
              {opt === "self" ? "Myself" : opt === "someone" ? "Someone else" : "Organization"}
            </button>
          ))}
        </div>

        <label className="font-semibold mt-3">Category</label>
        <select value={data.category} onChange={(e)=>setData(d=>({...d, category:e.target.value}))}
                className="w-full p-3 rounded-lg border bg-gray-50 focus:border-[#00AEEF]">
          <option value="">Select category</option>
          {["Medical","Education","Animals","Children","Women","Elderly","Sports","Environment","Community","Creative","Other"].map(c=>(
            <option key={c} value={c.toLowerCase()}>{c}</option>
          ))}
        </select>

        <div className="flex justify-between mt-4">
          <div/>
          <button onClick={next} style={{background:PRIMARY}} className="px-5 py-2 rounded text-white">Next</button>
        </div>
      </div>
    );
  }

  function Step2(){
    return (
      <div className="space-y-4">
        <label className="font-semibold">Beneficiary / Patient details</label>

        <input placeholder="Name" value={data.beneficiary.name || ""} onChange={(e)=>setData(d=>({...d, beneficiary:{...d.beneficiary, name:e.target.value}}))}
               className="w-full p-3 rounded-lg border bg-gray-50"/>
        <div className="grid grid-cols-2 gap-3">
          <input placeholder="Age" value={data.beneficiary.age || ""} onChange={(e)=>setData(d=>({...d, beneficiary:{...d.beneficiary, age:e.target.value}}))}
                 className="w-full p-3 rounded-lg border bg-gray-50"/>
          <select value={data.beneficiary.gender || ""} onChange={(e)=>setData(d=>({...d, beneficiary:{...d.beneficiary, gender:e.target.value}}))}
                  className="w-full p-3 rounded-lg border bg-gray-50">
            <option value="">Gender</option>
            <option value="male">Male</option><option value="female">Female</option><option value="other">Other</option>
          </select>
        </div>
        <input placeholder="Relation" value={data.beneficiary.relation || ""} onChange={(e)=>setData(d=>({...d, beneficiary:{...d.beneficiary, relation:e.target.value}}))} className="w-full p-3 rounded-lg border bg-gray-50"/>
        <input placeholder="Hospital" value={data.beneficiary.hospital || ""} onChange={(e)=>setData(d=>({...d, beneficiary:{...d.beneficiary, hospital:e.target.value}}))} className="w-full p-3 rounded-lg border bg-gray-50"/>
        <input placeholder="City" value={data.beneficiary.city || ""} onChange={(e)=>setData(d=>({...d, beneficiary:{...d.beneficiary, city:e.target.value}}))} className="w-full p-3 rounded-lg border bg-gray-50"/>
        <textarea placeholder="Describe condition / short note" value={data.beneficiary.condition || ""} onChange={(e)=>setData(d=>({...d, beneficiary:{...d.beneficiary, condition:e.target.value}}))} className="w-full p-3 rounded-lg border bg-gray-50"/>
        <div className="flex justify-between mt-4">
          <button onClick={prev} className="px-5 py-2 rounded border">Back</button>
          <button onClick={next} style={{background:PRIMARY}} className="px-5 py-2 rounded text-white">Next</button>
        </div>
      </div>
    );
  }

  function Step3(){
    // cover & gallery file inputs
    return (
      <div className="space-y-4">
        <label className="font-semibold">Campaign title</label>
        <input placeholder="Give your fundraiser a short, clear title" value={data.title || ""} onChange={(e)=>setData(d=>({...d, title:e.target.value}))} className="w-full p-3 rounded-lg border bg-gray-50"/>

        <label className="font-semibold">Story (detailed)</label>
        <textarea placeholder="Tell the story: why funds are needed, how they'll be used..." value={data.story || ""} onChange={(e)=>setData(d=>({...d, story:e.target.value}))} rows={8} className="w-full p-3 rounded-lg border bg-gray-50"/>

        <label className="font-semibold">Goal Amount (₹)</label>
        <input type="number" placeholder="Total amount required" value={data.goalAmount || ""} onChange={(e)=>setData(d=>({...d, goalAmount:e.target.value}))} className="w-full p-3 rounded-lg border bg-gray-50"/>

        <label className="font-semibold">Cover Image</label>
        <input type="file" accept="image/*" onChange={(e)=> setData(d=>({...d, coverImage: e.target.files[0]})) } />

        <label className="font-semibold">Gallery (multiple)</label>
        <input type="file" accept="image/*" multiple onChange={(e)=> setData(d=>({...d, gallery: Array.from(e.target.files)})) } />

        <label className="font-semibold">Video (YouTube link)</label>
        <input placeholder="Optional video URL" value={data.videoUrl || ""} onChange={(e)=>setData(d=>({...d, videoUrl:e.target.value}))} className="w-full p-3 rounded-lg border bg-gray-50"/>

        <div className="flex justify-between mt-4">
          <button onClick={prev} className="px-5 py-2 rounded border">Back</button>
          <button onClick={async ()=> {
            // upload files then next
            try {
              if (data.coverImage || (data.gallery && data.gallery.length)) {
                await uploadFiles({ cover: data.coverImage, gallery: data.gallery });
              } else {
                // still send an update for text fields
                await autosaveToBackend();
              }
              next();
            } catch (err) {
              alert("File upload failed");
            }
          }} style={{background:PRIMARY}} className="px-5 py-2 rounded text-white">Next</button>
        </div>
      </div>
    );
  }

  function Step4(){
    return (
      <div className="space-y-4">
        <label className="font-semibold">Payout / Bank details (for withdrawals)</label>
        <input placeholder="Account holder name" value={data.payout.accountHolder || ""} onChange={(e)=>setData(d=>({...d, payout:{...d.payout, accountHolder:e.target.value}}))} className="w-full p-3 rounded-lg border bg-gray-50"/>
        <input placeholder="Account number" value={data.payout.accountNumber || ""} onChange={(e)=>setData(d=>({...d, payout:{...d.payout, accountNumber:e.target.value}}))} className="w-full p-3 rounded-lg border bg-gray-50"/>
        <input placeholder="IFSC" value={data.payout.ifsc || ""} onChange={(e)=>setData(d=>({...d, payout:{...d.payout, ifsc:e.target.value}}))} className="w-full p-3 rounded-lg border bg-gray-50"/>
        <input placeholder="Bank name" value={data.payout.bankName || ""} onChange={(e)=>setData(d=>({...d, payout:{...d.payout, bankName:e.target.value}}))} className="w-full p-3 rounded-lg border bg-gray-50"/>
        <input placeholder="PAN number" value={data.payout.panNumber || ""} onChange={(e)=>setData(d=>({...d, payout:{...d.payout, panNumber:e.target.value}}))} className="w-full p-3 rounded-lg border bg-gray-50"/>
        <input placeholder="UPI ID (optional)" value={data.payout.upiId || ""} onChange={(e)=>setData(d=>({...d, payout:{...d.payout, upiId:e.target.value}}))} className="w-full p-3 rounded-lg border bg-gray-50"/>

        <label className="font-semibold">Upload PAN (optional)</label>
        <input type="file" accept=".pdf,image/*" onChange={(e)=> uploadFiles({ pan: e.target.files[0] }).then(()=>alert("PAN uploaded")).catch(()=>alert("Upload failed"))} />

        <label className="font-semibold">Upload Cancelled Cheque (optional)</label>
        <input type="file" accept=".pdf,image/*" onChange={(e)=> uploadFiles({ cheque: e.target.files[0] }).then(()=>alert("Cheque uploaded")).catch(()=>alert("Upload failed"))} />

        <div className="flex justify-between mt-4">
          <button onClick={prev} className="px-5 py-2 rounded border">Back</button>
          <button onClick={() => { autosaveToBackend(); next(); }} style={{background:PRIMARY}} className="px-5 py-2 rounded text-white">Next</button>
        </div>
      </div>
    );
  }

  function Step5Preview(){
    return (
      <div>
        <h3 className="font-semibold">Preview</h3>
        <div className="mt-4 p-4 border rounded bg-white">
          <h2 className="text-xl font-bold">{data.title || "(No title yet)"}</h2>
          <p className="mt-2 text-sm text-gray-700">{data.story ? data.story.substring(0,300) + (data.story.length>300?"...":"") : "(No story yet)"}</p>
          <p className="mt-2"><strong>Goal:</strong> ₹{data.goalAmount || 0}</p>
          <p className="mt-2"><strong>Category:</strong> {data.category || "-"}</p>
        </div>

        <div className="flex gap-3 mt-4">
          <button onClick={prev} className="px-5 py-2 rounded border">Back</button>
          <button onClick={publish} style={{background:PRIMARY}} className="px-5 py-2 rounded text-white">Publish</button>
          <button onClick={() => { autosaveToBackend(); alert("Saved as draft") }} className="px-5 py-2 rounded border">Save draft</button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <StepHeader />
      <div className="bg-white p-6 rounded-lg shadow">
        { step === 1 && <Step1 /> }
        { step === 2 && <Step2 /> }
        { step === 3 && <Step3 /> }
        { step === 4 && <Step4 /> }
        { step === 5 && <Step5Preview /> }
      </div>
    </div>
  );
}
