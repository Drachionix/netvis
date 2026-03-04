<script setup>
import { onMounted } from "vue";

const props = defineProps(['controller', 'showLoader'])
const options = props.controller.options

onMounted(() => {
  document.getElementById("autolayout").checked = options.autolayout
})
</script>

<template>
  <div class="options">
    <button @click="controller.undo">Undo</button>
    <button @click="controller.redo">Redo</button>
    Optionen:
    <label for="autolayout">
      <input id="autolayout" v-model="options.autolayout" class="hidden" type="checkbox">
      <span class="slider round"/>
      Auto-Layout
    </label>
    <label for="autoselect">
      <input id="autoselect" v-model="options.autoselect" class="hidden" type="checkbox">
      <span class="slider round"/>
      Auto-Select
    </label>
    <button @click="showLoader">Objekt laden</button>
    <button @click="controller.runLayout">Layout anstoßen</button>
    <button @click="controller.centerGraph">Graph zentrieren</button>
    <button @click="controller.selectedLayout">Markierte Layouten</button>
    <button @click="controller.selectedNeighbors">Zeige Nachbarn</button>

    Speichern:
    <button @click="controller.downloadSVG">SVG</button>
    <button @click="controller.downloadPNG">PNG</button>
    <button @click="controller.downloadJson">JSON</button>
  </div>
</template>

<style scoped>
.options {
  position: absolute;
  top: 0;
  right: 0;
  left: 0;
  height: 45px;
  background: #ccc;
  box-shadow: 0 0 0.5em black;
  z-index: 9;
  padding: 0.3em;
  border-radius: 0;
  margin-top: 0;
  font-size: 0.8em;
  -ms-user-select: none;
  -webkit-user-select: none;
  user-select: none;
  align-content: center;
}

input, label {
  cursor: pointer;
  position: relative;
  margin: 0 0.2em;
  width: 100px;
}

/* Hide default HTML checkbox */
.hidden {
  opacity: 0;
  width: 35px;
}

/* The slider */
.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  width: 35px;
  bottom: 0;
  background-color: #bebebe;
  -webkit-transition: .4s;
  transition: .4s;
  margin-right: 1em;

  &.round {
    border-radius: 24px;

    &:before {
      border-radius: 50%;
    }
  }
}

.slider:before {
  position: absolute;
  content: "";
  height: 9px;
  width: 9px;
  left: 4px;
  top: 17%;
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
  transform: translateX(18px);
}

button {
  background-color: var(--buttonColor);
  border-radius: 5px;
  box-shadow: rgba(255, 69, 0, .2) 0 2px 4px;
  color: #fff;
  cursor: pointer;
  height: 30px;
  line-height: 30px;
  padding: 0 20px;
  margin: 0 5px;
  -ms-user-select: none;
  -webkit-user-select: none;
  user-select: none;
  border: 0;
}
</style>