import AsyncStorage from "@react-native-async-storage/async-storage";
import { createCommunityStore } from "./store";
export const communityStore = createCommunityStore(AsyncStorage);
