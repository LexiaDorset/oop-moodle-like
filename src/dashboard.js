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

// Forms
const formCreateModule = document.querySelector('.add-module');

// Lists
const listTeachers = document.getElementById('list-participants');
const listModules = document.getElementById('list-module');


// *-------------------------------------------------------------------------------* //
// *-------------------------- Create a new module ----------------------------* //
// *-------------------------------------------------------------------------------* //
formCreateModule.addEventListener('submit', (e) => {
    e.preventDefault();
    addDoc(global.moduleRef, {
        name: formCreateModule.name.value,
    })
        .then(() => {
            console.log('Module added');
        })
        .catch((error) => {
            console.error('Error adding module:', error);
        });
    console.log("test");
    formCreateModule.reset();
});



// *-------------------------------------------------------------------------------* //
// *-------------------------- List Teachers ----------------------------* //
// *-------------------------------------------------------------------------------* //

function addUserToList() {
    console.log(global.userRef)
    onSnapshot(global.userRef, (querySnapshot) => {
        querySnapshot.forEach((docu) => {
            const ddata = docu.data();
            if (global.getUserRole(ddata) == "admin") return;
            let tr = document.createElement('tr');
            let a = document.createElement('a');
            let td = document.createElement('td');
            let td2 = document.createElement('td');
            td2.innerText = global.getUserRole(ddata);
            a.innerText = global.getUserName(ddata);
            a.href = "./profile.html?id=" + docu.id;
            td.append(a);
            tr.append(td, td2);
            listTeachers.appendChild(tr);
            console.log("Teacher added");
        });
    });
}

// *-------------------------------------------------------------------------------* //
// *-------------------------- List Modules ----------------------------* //
// *-------------------------------------------------------------------------------* //

function addModulesToList() {
    onSnapshot(global.moduleRef, (querySnapshot) => {
        querySnapshot.forEach((docu) => {
            const ddata = docu.data();
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
        });
    });
}

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
                if (docu.data().role == "faculty") {
                    window.location.replace("../faculty/dashboard.html");
                }
                else if (docu.data().role == "student") {
                    window.location.replace("../user/dashboard.html");
                }
                else {
                    document.body.style.display = "block";
                    addUserToList();
                    addModulesToList();
                    console.log("admin");
                }
            });
        }, (error) => {
            window.location.replace("login.html");
        });
    }
});

const user = auth.currentUser;