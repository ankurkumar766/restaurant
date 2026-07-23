const chatBox = document.getElementById("chat-box");

const input = document.getElementById("message");

const sendBtn = document.getElementById("send");

function addMessage(text,type){

const div=document.createElement("div");

div.className=type;

div.innerText=text;

chatBox.appendChild(div);

chatBox.scrollTop=chatBox.scrollHeight;

}

async function sendMessage(){

const message=input.value.trim();

if(!message) return;

addMessage(message,"user-message");

input.value="";

const loading=document.createElement("div");

loading.className="bot-message";

loading.innerText="Typing...";

chatBox.appendChild(loading);

chatBox.scrollTop=chatBox.scrollHeight;

const res=await fetch("/ai/chat",{

method:"POST",

headers:{

"Content-Type":"application/json"

},

body:JSON.stringify({

message

})

});

const data=await res.json();

loading.remove();

addMessage(data.reply,"bot-message");

}

sendBtn.onclick=sendMessage;

input.addEventListener("keypress",function(e){

if(e.key==="Enter"){

sendMessage();

}

});