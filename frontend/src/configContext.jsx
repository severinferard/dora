import { createContext } from "react";

const configContext = createContext({
  config: false,
  setConfig: (config) => {}
});

export default configContext;