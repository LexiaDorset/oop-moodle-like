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

let userId = "userId";
const user = auth.currentUser;


let params = new URLSearchParams(window.location.search);
let profileId = params.get('id');
console.log(profileId);
const userProfile = doc(global.moduleRef, profileId);
const profile = document.getElementById('profile');

const dropdownToggle = document.querySelector('.dropdown-toggle');
dropdownToggle.addEventListener('click', () => {
    const dropdownMenu = document.querySelector('.dropdown');
    dropdownMenu.classList.toggle('hidden');
});
const headProfile = document.getElementById('head-profile');

const detailsProfile = document.getElementById('list-profile');

const listCourses = document.getElementById('list-courses');

function addUserDetails() {
    let userR = doc(global.userRef, profileId);

    getDoc(userR).then((docu) => {
        if (docu.exists()) {
            const ddata = docu.data();
            let h1 = document.createElement('h1');
            h1.innerText = global.getUserName(ddata);
            headProfile.append(h1);
            let h4 = document.createElement('h4');
            let h5 = document.createElement('h5');
            let h42 = document.createElement('h4');
            let h52 = document.createElement('h5');
            h4.innerText = "Email: ";
            h5.innerText = global.getUserEmail(ddata);
            h4.append(h5)
            h42.innerText = "Role: ";
            h52.innerText = global.getUserRole(ddata);
            h42.append(h52);
            detailsProfile.append(h4, h42);
        } else {
            console.log("No such document!");
        }
    }).catch((error) => {
        console.log("Error getting document:", error);
    });
}

function addCourses() {
    return new Promise((resolve, reject) => {
        const courseQuery = query(global.usermoduleRef, where(global.usermoduleUserId, '==', profileId));
        onSnapshot(courseQuery, (querySnapshot) => {
            let size = querySnapshot.size;
            if (size == 0) {
                resolve();
            }
            let count = 0;
            querySnapshot.forEach((docu) => {
                let moduleId = global.getUserModuleId(docu.data());
                getDoc(doc(global.moduleRef, moduleId)).then((docu2) => {
                    const data2 = docu2.data();
                    let a = document.createElement('a');
                    a.innerText = global.getModuleName(data2);
                    let tr = document.createElement('tr');
                    let td1 = document.createElement('td');
                    let td = document.createElement('td');
                    let grade = global.getUserModuleGrade(docu.data());
                    td.innerText = "-";
                    if (grade != null) {
                        td.innerText = grade;
                    }

                    a.href = "module.html?id=" + docu2.id;
                    td1.append(a);
                    tr.append(td1, td);
                    tr.id = docu2.id + "toU";
                    listCourses.append(tr);
                    if (++count == size) resolve();
                });
            });
        });
    });
}

const formAddModule = document.querySelector('.add-module');
const selectModuleAdd = document.getElementById('selectModuleAdd');

function addModules() {
    onSnapshot(global.moduleRef, (querySnapshot) => {
        querySnapshot.forEach((doc) => {
            if (document.getElementById(doc.id + "toU") != null) return;
            addModuleToSelect(global.getModuleName(doc.data()), doc.id);
        });
    });

}

function addModuleToSelect(name, key) {
    if (document.getElementById(key + "addM")) return;
    const option = document.createElement('option');
    option.value = name;
    option.text = name;
    option.id = key + "addM";
    selectModuleAdd.appendChild(option);
}

formAddModule.addEventListener('submit', (e) => {
    e.preventDefault();
    if (selectModuleAdd.selectedIndex == -1) return;
    let moduleId = selectModuleAdd.options[selectModuleAdd.selectedIndex].id.slice(0, -4);
    addDoc(global.usermoduleRef, {
        module_id: moduleId,
        user_id: userId,
    })
        .then(() => {
            console.log('Module added to user');
        })
        .catch((error) => {
            console.error('Error adding Module:', error);
        });
    formAddModule.reset();
    window.addModule.close();
});


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
                }
                else if (docu.data().role == "student") {
                    if (docu.id != profileId) {
                        window.location.replace("dashboard.html");
                    }
                    addUserDetails();
                    addCourses();
                    console.log("student");
                }
                else {
                    document.querySelector(".admin-header-course").innerText = "Courses taken";
                    addUserDetails();
                    addCourses().then(() => {
                        addModules();
                        document.body.style.display = "block";
                    });
                    console.log("admin");
                }
                userId = docu.id;
            });
        }, (error) => {
            window.location.replace("login.html");
        });
    }
});

