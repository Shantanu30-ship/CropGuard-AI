const diseaseData = {
  tomato: {
    label: "Tomato",
    symptoms: [
      ["brown_rings","Brown spots with ring-like patterns"],
      ["yellow_leaves","Yellowing of older leaves"],
      ["dark_stems","Dark lesions on stems"],
      ["wet_spots","Water-soaked or rapidly darkening leaf spots"],
      ["white_growth","White fuzzy growth under leaves"],
      ["wilting","Wilting or drooping leaves"]
    ],
    diseases: [
      {id:"early",name:"Early blight",keys:["brown_rings","yellow_leaves","dark_stems"],about:"Early blight commonly causes brown leaf spots with concentric rings, often beginning on older foliage.",prevention:["Remove and dispose of affected plant debris; do not compost diseased material.","Avoid overhead watering and keep foliage as dry as practical.","Provide adequate spacing and airflow between plants.","Rotate crops and avoid planting tomatoes in the same area year after year."],management:"Inspect nearby plants and remove badly affected leaves using clean tools. Ask a local agricultural extension officer about locally registered control options."},
      {id:"late",name:"Late blight",keys:["wet_spots","white_growth","wilting"],about:"Late blight can cause water-soaked lesions that turn dark and may spread rapidly in favourable cool, humid conditions.",prevention:["Avoid prolonged leaf wetness and improve air circulation.","Remove infected plant material promptly and safely.","Use healthy planting material and locally recommended resistant varieties where available.","Monitor plants frequently during cool, wet weather."],management:"Treat suspected late blight as urgent because it can spread quickly. Seek local agricultural advice promptly; do not rely on this tool for confirmation."}
    ]
  },
  potato: {
    label:"Potato",
    symptoms:[
      ["wet_spots","Water-soaked dark patches on leaves"],
      ["white_growth","White fuzzy growth under leaves"],
      ["brown_rings","Brown spots with concentric rings"],
      ["yellow_leaves","Yellowing or drying of lower leaves"],
      ["tuber_rot","Dark, firm or rotting areas on tubers"],
      ["wilting","Wilting or collapse of foliage"]
    ],
    diseases:[
      {id:"late",name:"Late blight",keys:["wet_spots","white_growth","tuber_rot","wilting"],about:"Potato late blight may produce water-soaked leaf lesions, pale growth beneath leaves in humid conditions and tuber decay.",prevention:["Use certified, disease-free seed tubers.","Avoid excessive irrigation and prolonged leaf wetness.","Remove volunteer potato plants and infected crop residues.","Inspect crops frequently in cool, humid weather."],management:"Seek prompt advice from an agricultural extension officer if late blight is suspected. Follow local guidance for registered products and safe handling."},
      {id:"early",name:"Early blight",keys:["brown_rings","yellow_leaves"],about:"Early blight often appears as brown target-like spots on older potato leaves, followed by yellowing.",prevention:["Rotate with non-solanaceous crops.","Maintain balanced crop nutrition and avoid plant stress.","Remove infected debris after harvest.","Maintain appropriate spacing for airflow."],management:"Remove heavily affected foliage where practical and seek local guidance on integrated disease management."}
    ]
  },
  corn:{
    label:"Maize (Corn)",
    symptoms:[
      ["rust_pustules","Small reddish-brown raised pustules on leaves"],
      ["long_lesions","Long grey or tan leaf lesions"],
      ["yellow_leaves","Yellowing or drying leaves"],
      ["white_growth","White or grey fungal growth"],
      ["wilting","Wilting or stunted plants"],
      ["leaf_blight","Large brown areas spreading along leaf edges"]
    ],
    diseases:[
      {id:"rust",name:"Common rust",keys:["rust_pustules"],about:"Common rust is associated with small, raised reddish-brown pustules that develop on maize leaf surfaces.",prevention:["Choose locally recommended resistant hybrids where available.","Scout fields regularly, especially during humid weather.","Manage volunteer maize and crop residues as advised locally.","Maintain balanced nutrition and avoid unnecessary crop stress."],management:"Record the affected area and monitor spread. Confirm the disease with a local extension service before choosing a treatment."},
      {id:"blight",name:"Northern corn leaf blight (possible)",keys:["long_lesions","leaf_blight"],about:"Northern corn leaf blight can cause long, grey-green to tan cigar-shaped lesions on maize leaves. Other problems can look similar.",prevention:["Use resistant hybrids suited to the region.","Rotate crops and manage infected residues according to local guidance.","Monitor lower leaves and field areas with prolonged moisture.","Maintain good crop health and balanced fertility."],management:"Compare lesion shape and progression with local diagnostic guidance. Consult an agricultural expert for confirmation."}
    ]
  }
};

const cropSelect=document.getElementById("crop");
const symptomOptions=document.getElementById("symptomOptions");
const form=document.getElementById("diagnosisForm");
const fileInput=document.getElementById("plantImage");
const preview=document.getElementById("imagePreview");
const fileName=document.getElementById("fileName");
const dropZone=document.getElementById("dropZone");

cropSelect.addEventListener("change",renderSymptoms);
function renderSymptoms(){
  const crop=diseaseData[cropSelect.value];
  symptomOptions.innerHTML="";
  if(!crop){symptomOptions.innerHTML='<p class="muted">Select a crop first to see relevant symptoms.</p>';return;}
  crop.symptoms.forEach(([id,label])=>{
    const el=document.createElement("label");el.className="symptom-option";
    const input=document.createElement("input");input.type="checkbox";input.name="symptom";input.value=id;
    el.append(input,document.createTextNode(label));symptomOptions.append(el);
  });
}
document.getElementById("browseBtn").addEventListener("click",()=>fileInput.click());
fileInput.addEventListener("change",()=>showFile(fileInput.files[0]));
function showFile(file){
  if(!file)return;
  if(!file.type.startsWith("image/")){alert("Please choose an image file.");fileInput.value="";return;}
  if(file.size>8*1024*1024){alert("Please choose an image smaller than 8 MB.");fileInput.value="";return;}
  const reader=new FileReader();
  reader.onload=()=>{preview.src=reader.result;preview.hidden=false;fileName.textContent=file.name;};
  reader.readAsDataURL(file);
}
["dragenter","dragover"].forEach(evt=>dropZone.addEventListener(evt,e=>{e.preventDefault();dropZone.style.background="#f0f6ec";}));
["dragleave","drop"].forEach(evt=>dropZone.addEventListener(evt,e=>{e.preventDefault();dropZone.style.background="#fafcf9";}));
dropZone.addEventListener("drop",e=>{const f=e.dataTransfer.files[0];if(f){fileInput.files=e.dataTransfer.files;showFile(f);}});
form.addEventListener("submit",async e=>{
  e.preventDefault();
  const crop=diseaseData[cropSelect.value];
  if(!crop){alert("Please select a crop.");return;}
  // When a leaf image is attached, send it to the real cloud AI API.
  if(fileInput.files && fileInput.files[0]){
    await runAIPrediction(fileInput.files[0]);
    return;
  }
  const selected=[...document.querySelectorAll('input[name="symptom"]:checked')].map(x=>x.value);
  if(!selected.length){alert("Please select at least one visible symptom.");return;}
  const ranked=crop.diseases.map(d=>({...d,score:d.keys.filter(k=>selected.includes(k)).length})).filter(d=>d.score>0).sort((a,b)=>b.score-a.score);
  const section=document.getElementById("resultSection"),content=document.getElementById("resultContent");
  content.innerHTML="";
  if(!ranked.length){
    content.innerHTML='<article class="result-card"><span class="match-label">NO CLEAR MATCH IN THIS DEMO</span><h3>More information is needed</h3><p>The symptoms selected do not match the conditions currently covered by this demonstration. Check the plant carefully and contact a local agricultural expert for identification.</p></article>';
  }else{
    ranked.forEach((d,index)=>{
      const card=document.createElement("article");card.className="result-card";
      const tag=document.createElement("span");tag.className="match-label";tag.textContent=index===0?"TOP SYMPTOM MATCH · "+d.score+" MATCHED SYMPTOM(S)":"OTHER POSSIBLE MATCH · "+d.score+" MATCHED SYMPTOM(S)";
      const title=document.createElement("h3");title.textContent=d.name;
      const about=document.createElement("p");about.textContent=d.about;
      const cols=document.createElement("div");cols.className="result-columns";
      const prevention=document.createElement("div"),management=document.createElement("div");
      const ph=document.createElement("h4");ph.textContent="Prevention tips";
      const ul=document.createElement("ul");d.prevention.forEach(t=>{const li=document.createElement("li");li.textContent=t;ul.append(li);});
      prevention.append(ph,ul);
      const mh=document.createElement("h4");mh.textContent="Suggested next steps";
      const mp=document.createElement("p");mp.textContent=d.management;management.append(mh,mp);
      cols.append(prevention,management);card.append(tag,title,about,cols);content.append(card);
    });
  }
  const disclaimer=document.createElement("p");disclaimer.className="form-footnote";disclaimer.textContent="These are symptom matches from a small educational rule set, not probabilities or a confirmed diagnosis. The uploaded photo is only previewed in your browser; it is not analysed or sent to a server.";
  content.append(disclaimer);
  section.hidden=false;section.scrollIntoView({behavior:"smooth",block:"start"});
});
async function runAIPrediction(file){
  const api=(window.CROPGUARD_API_URL||"").trim().replace(/\/$/,"");
  if(!api || api.includes("PASTE_YOUR")){alert("The AI API is not connected yet. Deploy the backend, then add its HTTPS URL to config.js.");return;}
  const section=document.getElementById("resultSection"),content=document.getElementById("resultContent");
  content.innerHTML='<article class="result-card"><span class="match-label">AI IMAGE ANALYSIS</span><h3>Analysing your crop image…</h3><p>The image is being sent securely to the CropGuard cloud inference API.</p></article>';
  section.hidden=false;section.scrollIntoView({behavior:"smooth",block:"start"});
  const body=new FormData();body.append("file",file);
  try{
    const response=await fetch(api+"/predict",{method:"POST",body});
    const data=await response.json();
    if(!response.ok)throw new Error(data.detail||"Prediction request failed.");
    content.innerHTML="";
    const card=document.createElement("article");card.className="result-card";
    const tag=document.createElement("span");tag.className="match-label";tag.textContent=data.status==="prediction"?"AI IMAGE CLASSIFICATION":"LOW CONFIDENCE · PLEASE RETAKE PHOTO";
    const title=document.createElement("h3");title.textContent=data.status==="prediction"?data.condition:"The model is not confident";
    const summary=document.createElement("p");summary.textContent=data.status==="prediction"?`Detected crop: ${data.crop}. Model confidence: ${data.confidence}%.`:`Top result: ${data.condition} (${data.confidence}%). Try a clear, close-up photo of one leaf in daylight.`;
    const listTitle=document.createElement("h4");listTitle.textContent="Other model predictions";
    const ul=document.createElement("ul");(data.top3||[]).forEach(x=>{const li=document.createElement("li");li.textContent=`${x.label.replace("___"," — ").replaceAll("_"," ")}: ${x.confidence}%`;ul.append(li);});
    const note=document.createElement("p");note.className="form-footnote";note.textContent=data.notice+" This model covers 38 PlantVillage categories; unfamiliar diseases or other crops may be misclassified.";
    card.append(tag,title,summary,listTitle,ul,note);content.append(card);
    const advice=document.createElement("article");advice.className="result-card";
    const h=document.createElement("h4");h.textContent="What to do next";
    const p=document.createElement("p");p.textContent="Check the affected plant and nearby plants, photograph symptoms in good daylight, avoid moving potentially infected plant material, and confirm the result with a local agricultural extension officer before applying any treatment. Use locally approved integrated pest-management guidance.";
    advice.append(h,p);content.append(advice);
  }catch(err){content.innerHTML="";const c=document.createElement("article");c.className="result-card";const h=document.createElement("h3");h.textContent="Could not analyse the image";const p=document.createElement("p");p.textContent=err.message+" Check that the API is deployed, healthy and allows this website's origin.";c.append(h,p);content.append(c);}
}

document.getElementById("resetBtn").addEventListener("click",()=>{
  form.reset();preview.hidden=true;preview.removeAttribute("src");fileName.textContent="Choose a file or drag it here";renderSymptoms();
  document.getElementById("resultSection").hidden=true;document.getElementById("detect").scrollIntoView({behavior:"smooth"});
});
document.querySelectorAll("[data-crop]").forEach(link=>link.addEventListener("click",()=>{cropSelect.value=link.dataset.crop;renderSymptoms();}));
document.getElementById("menuToggle").addEventListener("click",()=>document.querySelector(".desktop-nav").classList.toggle("open"));
document.querySelectorAll(".desktop-nav a").forEach(a=>a.addEventListener("click",()=>document.querySelector(".desktop-nav").classList.remove("open")));
