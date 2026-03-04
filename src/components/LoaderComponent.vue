<script setup>
import { ref } from "vue";

const props = defineProps({
  node: {
    name: String,
    v6: Boolean,
    required: true
  },
  path: {
    source: String,
    destination: String
  }
})

const emit = defineEmits(['submitted'])
const initName = props.node.name
const node = ref(props.node)
const path = ref(props.path)
const style = "width: " + (initName ? "49%" : "100%")
const title = import.meta.env.VITE_APP_TITLE


function submitHandler() {
  if ( node.value.name === "" ) node.value.name = initName
  console.log("Submit ", node.value, path.value)
  emit('submitted', node.value, path.value)
}

function onFileChanged(event) {
  let reader = new FileReader()
  reader.onload = (e) => {
    try {
      let data = JSON.parse(e.target.result)
      emit('submitted', data)
    } catch (e) {
      console.error("Die Datei \"" + event.target.files[0].name + "\" enthält kein gültiges JSON")
      console.warn(e)
    }
  }
  reader.readAsText(event.target.files[0])
}

</script>

<template>
  <div class="loader">
    <div class="form">
      <form @submit.prevent="submitHandler">
        <div class="title">{{ title }}</div>
        <div class="inputContainer">
          <input type="text" :placeholder="node.name || initName" @input="e => node.name = e.target.value" class="input"
                 id="object"/>
          <div class="cut"></div>
          <label for="object" class="placeholder">Netspoc-Objekt</label>
          <label class="switch">
            <input type="checkbox" v-model="node.v6" id="v6" class="hidden"/>
            <span class="slider round"/>
            <p>IPv6</p>
          </label>
          <input type="text" class="input" id="source" style="width: 49%" :placeholder="path.source"
                 v-if="initName" @input="e => path.source = e.target.value"/>
          <input type="text" class="input" id="destination" style="width: 49%; margin-left: 5px;"
                 :placeholder="path.destination" v-if="initName"
                 @input="e => path.destination = e.target.value"/><br>
          <button class="submit" type="submit" :style="style">Anzeigen</button>
          <label for="file-upload" v-if="initName" class="submit loadFile">JSON Laden</label>
          <input id="file-upload" type="file" @change="onFileChanged" accept="application/json" class="hidden"/>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
.loader {
  z-index: 10;
  background-color: rgba(1, 1, 1, 0.5);
}

.form {
  background-color: #cecece;
  box-shadow: 0 0 5px #ff4212;
  border-radius: 5px;
  padding: 0 10px 120px;
  z-index: 10;
  height: 340px;
}

.title {
  color: #303245;
  width: 100%;
  font-family: sans-serif;
  font-size: 36px;
  font-weight: 600;
  margin-top: 30px;
  margin-bottom: 0.5em;
  padding: 0.5em 1em;
  border-radius: 12px;
}

.inputContainer {
  height: 50px;
  position: relative;
  width: 100%;
}

.input {
  background-color: #303245;
  border-radius: 12px;
  border: 0;
  box-sizing: border-box;
  color: #eee;
  font-size: 18px;
  height: 100%;
  outline: 0;
  padding: 4px 20px 0;
  width: 100%;

  &::placeholder {
    display: block;
  }

  -ms-user-select: none;
  -webkit-user-select: none;
  user-select: none;
}

.cut {
  background-color: var(--bodyBgColor);
  border-radius: 10px;
  height: 20px;
  left: 20px;
  position: absolute;
  top: -20px;
  transform: translateY(8px);
  transition: transform 200ms;
  width: 102px;
  z-index: 0;
}

.input:focus ~ .cut,
.input:not(:placeholder-shown) ~ .cut {
  transform: translateY(8px);
  z-index: 0;
}

.placeholder {
  color: #808097;
  font-family: sans-serif;
  left: 20px;
  line-height: 14px;
  pointer-events: none;
  position: absolute;
  transform-origin: 0 50%;
  transition: transform 200ms, color 200ms;
  top: 20px;
  transform: translateY(-30px) translateX(10px) scale(0.75);
}

.input:focus ~ .placeholder {
  color: var(--buttonColor);
}

.submit {
  background-color: var(--buttonColor);
  border-radius: 12px;
  border: 0;
  box-sizing: border-box;
  color: #eee;
  cursor: pointer;
  font-size: 18px;
  height: 50px;
  margin-top: 5px;
  text-align: center;
}

.submit:active {
  background-color: var(--buttonActiveColor);
}

.loadFile {
  margin-left: 5px;
  padding: 15px 0;
  display: inline-block;
  width: 49%;
}

.switch {
  position: relative;
  display: grid;
  grid-template-columns: 230px 64px;
  grid-template-rows: 34px;
  grid-template-areas: "ipv6 switch";
  margin-top: 5px;
}

/* Hide default HTML checkbox */
.hidden {
  opacity: 0;
  width: 0;
  height: 0;
}

/* The slider */
.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #bebebe;
  -webkit-transition: .4s;
  transition: .4s;
  grid-area: switch;
}

.slider:before {
  position: absolute;
  content: "";
  height: 26px;
  width: 26px;
  left: 4px;
  bottom: 4px;
  background-color: #efefef;
  -webkit-transition: .4s;
  transition: .4s;
}

input:checked + .slider {
  background: var(--buttonColor);
  transition: 1s color;
}

input:focus + .slider {
  border: 50px black;
  box-shadow: 0 0 5px #303245;
}

input:checked + .slider:before {
  transform: translateX(26px);
}

/* Rounded sliders */
.slider.round {
  border-radius: 24px;
}

.slider.round:before {
  border-radius: 50%;
}

.switch p {
  height: 30px;
  display: flex;
  justify-content: right;
  bottom: 0;
  margin-right: 1em;
  align-items: center;
  grid-area: ipv6;
}
</style>