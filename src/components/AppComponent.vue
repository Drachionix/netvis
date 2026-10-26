<script setup>
import CytoscapeComponent from "@/components/CytoscapeComponent.vue";
import NodeInfoComponent from "@/components/NodeInfoComponent.vue";
import LegendComponent from "@/components/LegendComponent.vue";
import LoaderComponent from "@/components/LoaderComponent.vue";
import OptionsComponent from "@/components/OptionsComponent.vue";

import Cytoscape from "cytoscape";
import coseBilkent from "cytoscape-cose-bilkent";
import popper from "cytoscape-popper";
import svg from "cytoscape-svg";
import style from "@/cy-style.js";
import Controller from "@/controller.js";
import { onBeforeUnmount, onMounted, ref } from "vue";
import tippy from "tippy.js";
import undoRedo from "@/cytoscape-undo-redo.js";


Cytoscape.use(coseBilkent)
Cytoscape.use(svg)
Cytoscape.use(undoRedo)

function tippyFactory(ref, content) {
  let dummyEle = document.createElement('div')
  let tip = new tippy(dummyEle, {
    getReferenceClientRect: ref.getBoundingClientRect,
    trigger: 'manual',
    content: content,
    arrow: true,
    placement: 'top',
    hideOnClick: false,

    // if interactive:
    interactive: true,
    appendTo: document.body
  })
  return tip
}

Cytoscape.use(popper(tippyFactory))

const cy = new Cytoscape({
  style: style,
  layout: { name: 'preset' },
  maxZoom: 1.5,
  wheelSensitivity: 0.1
})

const props = defineProps(['node', 'path', 'localObjects'])
const controller = new Controller({ cy, localObjects: props.localObjects })
const bus = controller.bus
const infoNode = ref()
const showLoader = ref()
let onShowInfo, onHideInfo, onKeyDown

onMounted(() => {
  window.cy = cy
  window.controller = controller

  bus.on('showInfo', onShowInfo = ((node) => {
    infoNode.value = node
  }))

  bus.on('hideInfo', onHideInfo = (() => {
    infoNode.value = null
  }))

  document.addEventListener("keydown", onKeyDown = (e) => {
    if ( showLoader.value && e.key === "Escape" ) {
      showLoader.value = false
      return
    }
    if ( !e.ctrlKey || e.ctrlKey &&
        e.key !== 's' && e.key !== 'e' &&
        e.key !== 'z' && e.key !== 'y' && e.key !== 'Z' ) {
      return
    }
    e.preventDefault()
    //CTRL + S
    if ( e.key === 's' ) controller.downloadJson()
    if ( e.key === 'e' ) showLoaderHandler()
    if ( e.key === 'z' ) cy.undoRedo().undo()
    if ( e.key === 'Z' || e.key === 'y' ) cy.undoRedo().redo()
  })
})

onBeforeUnmount(() => {
  bus.removeListener('showInfo', onShowInfo)
  bus.removeListener('hideInfo', onHideInfo)
  document.removeEventListener("keydown", onKeyDown)
})

function submitHandler(node) {
  if ( node.name )
    controller.showSingleNode(node.name, node.v6)
  showLoader.value = false
}

function showLoaderHandler() {
  cy.elements().unselect()
  showLoader.value = !showLoader.value
}

</script>

<template>
  <LoaderComponent v-if="showLoader" :node="{name:'', v6: false}" :localObjects="localObjects"
                   @submitted="submitHandler"/>
  <CytoscapeComponent :cy="cy" :controller="controller" :node="node" :path="path"/>
  <NodeInfoComponent v-if="infoNode" :cy="cy" :node="infoNode" :controller="controller"/>
  <LegendComponent/>
  <OptionsComponent :controller="controller" :showLoader="showLoaderHandler"/>
</template>

<style scoped>

</style>