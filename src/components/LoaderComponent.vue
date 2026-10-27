<script setup>
import { ref, shallowRef } from "vue";
import { parseJsonFile } from "@/local-objects.js";

const props = defineProps({
  node: {
    name: String,
    v6: Boolean,
    required: true
  },
  path: {
    source: String,
    destination: String
  },
  localObjects: {
    type: Map,
    default: null
  }
})

const emit = defineEmits(['submitted'])
const initName = props.node.name
const node = ref(props.node)
const path = ref(props.path)
const localObjects = shallowRef(props.localObjects)
const fileName = ref("")
const fileError = ref("")
const loading = ref(false)
const dragDepth = ref(0)
const fileInput = ref()
const title = import.meta.env.VITE_APP_TITLE


function submitHandler() {
  if ( loading.value ) return
  if ( node.value.name === "" ) node.value.name = initName
  if ( localObjects.value && !localObjects.value.has(node.value.name) && node.value.name ) {
    fileError.value = `Objekt ${node.value.name} nicht in der geladenen Topologie gefunden.`
    return
  }
  emit('submitted', node.value, localObjects.value ? undefined : path.value, localObjects.value)
}

async function loadFiles(files) {
  if ( !initName || loading.value || !files?.length ) return
  if ( files.length !== 1 ) {
    fileError.value = "Bitte genau eine JSON-Datei laden."
    return
  }
  const file = files[0]
  loading.value = true
  fileError.value = ""
  try {
    const result = parseJsonFile(await file.text())
    if ( result.objects ) {
      localObjects.value = result.objects
      fileName.value = file.name
    } else {
      emit('submitted', result.graph, undefined, localObjects.value)
    }
  } catch (error) {
    fileError.value = `${file.name}: ${error.message}`
  } finally {
    loading.value = false
  }
}

async function onFileChanged(event) {
  try {
    await loadFiles(event.target.files)
  } finally {
    event.target.value = ""
  }
}

function onDragEnter(event) {
  if ( initName && event.dataTransfer?.types.includes("Files") ) dragDepth.value++
}

function onDrop(event) {
  dragDepth.value = 0
  return loadFiles(event.dataTransfer?.files)
}

function useBackend() {
  localObjects.value = null
  fileName.value = ""
  fileError.value = ""
}

</script>

<template>
  <div class="loader"
       @dragenter.prevent="onDragEnter" @dragover.prevent
       @dragleave.prevent="dragDepth = Math.max(0, dragDepth - 1)" @drop.prevent="onDrop">
    <div class="form" :class="{ dragging: dragDepth > 0 }">
      <form @submit.prevent="submitHandler">
        <div class="title">{{ title }}</div>
        <div v-if="initName && localObjects" class="data-source">
          Topologie {{ fileName }}: {{ localObjects.size }} Objekte geladen.
        </div>
        <p v-if="fileError" class="file-error" role="alert" style="margin-bottom: 20px">{{ fileError }}</p>
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
          <input type="text" class="input" id="source" :placeholder="path.source"
                 v-if="initName && !localObjects" @input="e => path.source = e.target.value"/>
          <input type="text" class="input" id="destination"
                 :placeholder="path.destination" v-if="initName && !localObjects"
                 @input="e => path.destination = e.target.value"/><br>
          <button class="submit" type="submit" :disabled="loading">Anzeigen</button>
          <div v-if="initName" class="buttonRow">
            <button v-if="localObjects" class="submit" type="button" @click="useBackend"
                    :disabled="loading">Backend verwenden
            </button>
            <button class="submit" type="button" @click="fileInput.click()" :disabled="loading">JSON laden</button>
          </div>
          <input v-if="initName" ref="fileInput" id="file-upload" type="file" @change="onFileChanged"
                 accept=".json,application/json" :disabled="loading" class="hidden"/>
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
  padding: 0 10px;
  z-index: 10;
}

.form.dragging {
  outline: 3px dashed var(--buttonColor);
}


.data-source {
  margin-bottom: 20px;
  width: 100%;
  color: #303245;
}

.file-error {
  color: #9c1600;
  width: 100%;
  max-width: 500px;
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
  height: 50px;
  outline: 0;
  padding: 4px 20px 0;
  width: 100%;
  margin: 10px 0 0 0;

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
  margin-top: 10px;
  text-align: center;
  width: 100%;
}

.buttonRow {
  display: flex;
  gap: 10px;
  margin-top: 10px;
}

.buttonRow .submit {
  flex: 1 1 0;
  min-width: 0;
  margin-top: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.submit:active {
  background-color: var(--buttonActiveColor);
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