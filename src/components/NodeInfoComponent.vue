<script setup>
import { onBeforeUpdate, reactive } from "vue";

const props = defineProps(['cy', 'node', 'controller'])
let neighbors, hosts
if ( props.node.data().neighbors )
  neighbors = reactive(props.node.data().neighbors.sort((a, b) => b.neighbor_count - a.neighbor_count))
if ( props.node.data().hosts )
  hosts = reactive(props.node.data().hosts)

onBeforeUpdate(() => {
  if ( props.node.data().neighbors )
    neighbors = reactive(props.node.data().neighbors.sort((a, b) => b.neighbor_count - a.neighbor_count))
  if ( props.node.data().hosts )
    hosts = reactive(props.node.data().hosts)
})

const showAllNeighbors = (neighbors) => {
  if ( neighbors ) {
    let neigh = []
    neighbors.filter(n => !n.id.startsWith("area:")).forEach(n => neigh.push(n))
    props.controller.showNode(neigh, props.node.data().v6)
  }
}

</script>

<template>
  <div class="app-node-info">
    <div class="node-info-name">Nachbarn</div>
    <div class="node-info-body">
      <ul class="node-info-list">
        <li class="clickable" @click="async () => showAllNeighbors(neighbors)">zeige alle</li>
        <template v-for="n in neighbors">
          <li class="clickable"
              v-if='!n.id.startsWith("interface") && !n.id.startsWith("network:tunnel") && !n.id.startsWith("area:")'
              @click="async () => controller.showSingleNode(n.id, node.data().v6)">
            {{ n.id + (cy.getElementById(n.id).length === 1 ? "⋆" : "") }}
          </li>
        </template>
      </ul>
    </div>
  </div>
  <div class="app-node-info right">
    <div class="node-info-name">{{ node.id() }}</div>
    <div class="node-info-body"
         v-if='node.data("hosts") || node.data("neighbors").filter(n => n.id.startsWith("interface:")).length > 0'>
      <ul class="node-info-list">
        <template v-for="n in neighbors">
          <li
              v-if='n.id.startsWith("interface")'
          >{{ n.id }}
          </li>
        </template>
        <template v-if='node.data("hosts")' v-for="h in hosts">
          <li>
            {{ h }}
          </li>
        </template>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.app-node-info {
  position: absolute;
  top: 50px;
  left: 0;
  background: var(--buttonColor);
  box-shadow: 0 0 1em black;
  z-index: 10;
  padding: 0.5em;
  border-radius: 0.5em;
  margin: 1em;
  font-size: 0.8em;
  color: #fff;
  cursor: default;
}

.app-node-info.right {
  right: 0;
  left: unset;
}

.node-info-name {
  display: flex;
  justify-content: center;
  font-size: 1.25em;
  margin: 0.125em 0.2em;
}

.node-info-body {
  margin-top: 0.5em;

  .node-info-list {
    overflow: auto;
    max-height: 70vh;

    li {
      margin: 0.2em;
      margin-block-end: 0.1em;
      padding: 0.2em;
    }

    .clickable:hover {
      color: var(--buttonActiveColor);
      cursor: pointer;
      -ms-user-select: none;
      -webkit-user-select: none;
      user-select: none;
    }
  }
}
</style>