const USER="Marco";
const PASS="Ginevra@1984";

let tasks=JSON.parse(localStorage.getItem("tasks"))||[];
let filter="all";

const loginBtn=document.getElementById("loginBtn");

loginBtn.onclick=()=>{

const u=document.getElementById("username").value;
const p=document.getElementById("password").value;

if(u===USER && p===PASS){

document.getElementById("loginScreen").classList.remove("active");
document.getElementById("appScreen").classList.add("active");

render();

}else{

document.getElementById("loginError").textContent="Accesso non consentito";

}

};

document.getElementById("addTaskBtn").onclick=addTask;

document.querySelectorAll("[data-filter]").forEach(btn=>{

btn.onclick=()=>{

filter=btn.dataset.filter;
render();

};

});

document.getElementById("themeToggle").onclick=()=>{

document.body.classList.toggle("dark");

};

function addTask(){

const text=document.getElementById("taskText").value.trim();

if(!text) return;

const type=document.getElementById("taskType").value;
const date=document.getElementById("taskDate").value;
const time=document.getElementById("taskTime").value;

tasks.push({

id:Date.now(),
text,
type,
date,
time,
completed:false,
createdAt:new Date().toISOString()

});

save();
render();

}

function save(){

localStorage.setItem("tasks",JSON.stringify(tasks));

}

function render(){

renderTasks();
renderCalendar();

}

function renderTasks(){

const list=document.getElementById("taskList");

list.innerHTML="";

let filtered=[...tasks];

const today=new Date().toISOString().slice(0,10);

if(filter==="todo"){

filtered=filtered.filter(t=>!t.completed);

}

if(filter==="done"){

filtered=filtered.filter(t=>t.completed);

}

if(filter==="scheduled"){

filtered=filtered.filter(t=>t.type==="scheduled");

}

if(filter==="today"){

filtered=filtered.filter(t=>t.date===today);

}

filtered.forEach(task=>{

const li=document.createElement("li");

if(task.completed){

li.classList.add("completed");

}

li.innerHTML=`

<strong>${task.text}</strong><br>

${task.date||""} ${task.time||""}

<button onclick="toggleTask(${task.id})">
${task.completed?"Riapri":"Completa"}
</button>

<button onclick="editTask(${task.id})">
Modifica
</button>

<button onclick="deleteTask(${task.id})">
Elimina
</button>

`;

list.appendChild(li);

});

}

function toggleTask(id){

tasks=tasks.map(t=>

t.id===id
?{...t,completed:!t.completed}
:t

);

save();
render();

}

function deleteTask(id){

tasks=tasks.filter(t=>t.id!==id);

save();
render();

}

function editTask(id){

const task=tasks.find(t=>t.id===id);

const value=prompt("Modifica task",task.text);

if(value){

task.text=value;

save();
render();

}

}

function renderCalendar(){

const cal=document.getElementById("calendar");

cal.innerHTML="";

const now=new Date();

const month=now.getMonth();

const year=now.getFullYear();

const days=new Date(year,month+1,0).getDate();

const today=new Date().getDate();

for(let i=1;i<=days;i++){

const div=document.createElement("div");

div.className="day";

if(i===today){

div.classList.add("today");

}

const dateString=
`${year}-${String(month+1).padStart(2,"0")}-${String(i).padStart(2,"0")}`;

if(tasks.some(t=>t.date===dateString)){

div.classList.add("hasTask");

}

div.textContent=i;

cal.appendChild(div);

}

}

if("serviceWorker" in navigator){

navigator.serviceWorker.register("service-worker.js");

}