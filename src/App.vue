<script setup>
import LoaderComponent from "@/components/LoaderComponent.vue";
import AppComponent from "@/components/AppComponent.vue";

import { ref } from "vue";

const node = ref()
const path = ref()

function submitHandler(n, p) {
  node.value = n
  path.value = p
}
</script>

<template>
  <LoaderComponent v-if="!node" :node="{name:'router:internet-netze', v6: false}"
                   :path="{source:'Quelle', destination:'Ziel'}"
                   @submitted="submitHandler"/>
  <AppComponent v-else :node="node" :path="path"/>
</template>