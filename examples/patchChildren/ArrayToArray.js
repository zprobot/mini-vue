import { h } from "../../lib/mini-vue.esm.js"
const prevChildren = [
    h("p", { key: "A" }, "A"),
    h("p", {}, "C"),
    h("p", { key: "B" }, "B"),
    h("p", { key: "D" }, "D"),
  ];
  
  const nextChildren = [
    h("p", { key: "A" }, "A"),
    h("p", { key: "B" }, "B"),
    h("p", {}, "C"),
    h("p", { key: "D" }, "D"),
  ];
  
  export default {
    name: "ArrayToArray",
    setup() {
      const isChange = ref(false);
      window.isChange = isChange;
  
      return {
        isChange,
      };
    },
    render() {
      const self = this;
  
      return self.isChange === true
        ? h("div", {}, nextChildren)
        : h("div", {}, prevChildren);
    },
  };