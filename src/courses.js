import { initializeApp } from 'firebase/app';
import {
    getAuth,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    fetchSignInMethodsForEmail,
    deleteUser,
    onAuthStateChanged,
    signOut, sendPasswordResetEmail
} from "firebase/auth";
import {
    getFirestore, collection, onSnapshot,
    addDoc, deleteDoc, doc,
    query, where,
    orderBy, serverTimestamp,
    getDoc, child, get, Timestamp, updateDoc
} from 'firebase/firestore';

import * as global from "./global.js";

// Auth
const auth = getAuth();


// Lists
const listModules = document.getElementById('list-module');

const profile = document.getElementById('profile');

// *-------------------------------------------------------------------------------* //
// *-------------------------- Add Modules to list all----------------------------* //
// *-------------------------------------------------------------------------------* //

function addModulesToListd(ddata, docu) {
    let div = document.createElement('div');
    div.classList.add("card");

    let a1 = document.createElement('a');
    a1.href = "module.html?id=" + docu.id + "&type=course";
    let img = document.createElement('img');
    img.classList.add("card-img-top");
    img.src = "../../assets/img/logo.png";
    a1.appendChild(img);


    let divbody = document.createElement('div');
    divbody.classList.add("card-body");
    let title = document.createElement('a');
    title.classList.add("card-title");
    title.innerText = global.getModuleName(ddata);
    title.href = "module.html?id=" + docu.id;

    let p = document.createElement('p');
    p.classList.add("card-text");
    p.innerText = global.getModuleDescription(ddata);

    divbody.append(title, p);
    div.append(a1, divbody);

    listModules.appendChild(div);
}

// *-------------------------------------------------------------------------------* //
// *------------------------- List Modules For Student ----------------------------* //
// *-------------------------------------------------------------------------------* //

function addModulesToListStudent() {
    const userModuleQuery = query(global.usermoduleRef, where(global.usermoduleUserId, "==", userId));
    onSnapshot(userModuleQuery, (querySnapshot) => {
        querySnapshot.forEach((docu2) => {
            getDoc(doc(global.moduleRef, global.getUserModuleId(docu2.data()))).then((docu) => {
                addModulesToListd(docu.data(), docu)
            });
        });
    });
}


// *-------------------------------------------------------------------------------* //
// *-------------------------- Profile Redirection ----------------------------* //
// *-------------------------------------------------------------------------------* //

let userId = "null";

// *-------------------------------------------------------------------------------* //
// *-------------------------------------------------------------------------------* //
// *----------------------- AUTHENTIFICATIONS -------------------------------* //
// *-------------------------------------------------------------------------------* //
// *-------------------------------------------------------------------------------* //



onAuthStateChanged(auth, (user) => {
    //AuthChanges(user);
    if (user == null) {
        window.location.replace("login.html");
        return;
    }
    else {
        const userQuery = query(global.userRef, where(global.userId, '==', user.uid));
        console.log("User logged in", user.uid);
        onSnapshot(userQuery, (querySnapshot) => {
            querySnapshot.forEach((docu) => {
                userId = docu.id;
                global.navButton(profile, userId, document.querySelector('.dropdown-toggle'), document.querySelector('.dropdown'), document.querySelector(".logout"), auth);
                global.showCourses(document.querySelector(".nav-extend"), document.querySelector(".toggle-all"), "./courses.html", "Courses");
                addModulesToListStudent();
                document.body.style.display = "block";
            });
        }, (error) => {
            window.location.replace("login.html");
        });
    }
});

const user = auth.currentUser;