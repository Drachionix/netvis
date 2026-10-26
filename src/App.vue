<script setup>
import LoaderComponent from "@/components/LoaderComponent.vue";
import AppComponent from "@/components/AppComponent.vue";

import { ref, shallowRef } from "vue";

const node = ref()
const path = ref()
const localObjects = shallowRef(null)

function submitHandler(n, p, objects) {
  node.value = n
  path.value = p
  localObjects.value = objects
}
</script>

<template>
  <LoaderComponent v-if="!node" :node="{name:'router:internet-netze', v6: false}"
                   :path="{source:'Quelle', destination:'Ziel'}"
                   @submitted="submitHandler"/>
  <AppComponent v-else :node="node" :path="path" :localObjects="localObjects"/>
</template>