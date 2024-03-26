import { initializeApp } from 'firebase/app';
import {
    getAuth,
    onAuthStateChanged,
    signOut
} from "firebase/auth";

import * as global from "./global.js";


// Auth
const auth = getAuth();

// *-------------------------------------------------------------------------------* //
// *-------------------------- Elements ----------------------------* //
// *-------------------------------------------------------------------------------* //
const buttonLogout = document.querySelector(".logout");

// *-------------------------------------------------------------------------------* //
// *-------------------------- Function ----------------------------* //
// *-------------------------------------------------------------------------------* //
buttonLogout.addEventListener("click", () => {
    signOut(auth).then(() => {
        console.log("User signed out");
    }).catch((error) => {
        console.error(error);
    });
});
