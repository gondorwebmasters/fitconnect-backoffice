import { addCollection } from "@iconify/react";

import { iconSets } from "./register-icons.generated";

// Registers the icon sets locally so <Iconify> resolves icons from memory
// instead of fetching them from api.iconify.design on every first use.
iconSets.forEach((set) => addCollection(set));
