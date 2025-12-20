let a = Math.floor(Math.random()*10);
let b = Math.floor(Math.random()*10);

function loadCaptcha() {
  document.getElementById("captchaQ").innerText =
    `Solve: ${a} + ${b}`;
}

function checkCaptcha() {
  return document.getElementById("captchaA").value == (a + b);
}