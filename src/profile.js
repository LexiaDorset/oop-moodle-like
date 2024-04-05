import { initializeApp } from 'firebase/app';
import {
    getAuth,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    fetchSignInMethodsForEmail,
    deleteUser,
    onAuthStateChanged,
    signOut, sendPasswordResetEmail,
    updatePassword
} from "firebase/auth";
import {
    getFirestore, collection, onSnapshot,
    addDoc, deleteDoc, doc,
    query, where,
    orderBy, serverTimestamp,
    getDoc, child, get, Timestamp, updateDoc
} from 'firebase/firestore';

import * as global from "./global.js";
// Name: Lucile PELOU
// Student ID: 74526
// Auth
const auth = getAuth();

let userId = "userId";
let user = auth.currentUser;
let role = "role";

let params = new URLSearchParams(window.location.search);
let profileId = params.get('id');
console.log(profileId);
const userProfile = doc(global.userRef, profileId);
const profile = document.getElementById('profile');
var roleSelect = document.getElementById('selectUserEdit');

const headProfile = document.getElementById('head-profile');

const detailsProfile = document.getElementById('list-profile');

const listCourses = document.getElementById('list-courses');
const listClass = document.getElementById('list-class');

const editUserForm = document.querySelector('.edit-user');
let editUserButton = document.getElementById('editButtonUser');
let editUserFormU = document.querySelector('.edit-user-u');

function addUserDetails() {
    let userR = doc(global.userRef, profileId);

    getDoc(userR).then((docu) => {
        if (docu.exists()) {
            const ddata = docu.data();
            let h1 = document.createElement('h1');
            h1.innerText = global.getUserName(ddata);
            document.title = "Profile: " + global.getUserName(ddata);
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

function addClass() {
    let classQuery = query(global.userclassRef, where(global.userClassUserId, '==', profileId));
    onSnapshot(classQuery, (querySnapshot) => {
        querySnapshot.forEach((docu) => {
            let classId = global.getUserClassClassId(docu.data());
            getDoc(doc(global.classRef, classId)).then((docu2) => {
                if (document.getElementById(docu2.id + "toC") != null) return;
                /* if (document.getElementById(classId + "addM") != null) {
                     document.getElementById(classId + "addM").remove();
                     console.log("Suppression de l'option");
                 }*/
                const data2 = docu2.data();
                let a = document.createElement('a');
                a.innerText = global.getClassName(data2);
                let tr = document.createElement('tr');
                tr.id = docu2.id + "classL";
                let td1 = document.createElement('td');
                a.href = "class.html?id=" + docu2.id;
                td1.append(a);
                tr.append(td1);
                tr.id = docu2.id + "toC";
                if (role == global.roleAdmin) {
                    let td4 = document.createElement('td');
                    let i = document.createElement('i');
                    i.classList.add("fas", "fa-trash-alt");
                    i.onclick = function () {
                        if (window.confirm("Are you sure you want to delete this user from this class?") == false) return;
                        global.deleteClassUser(classId, profileId).then(() => {
                            console.log("User class deleted");
                            addClassToSelect(global.getClassName(data2), classId);
                            document.getElementById(docu2.id + "toC").remove();
                        }).catch((error) => {
                            console.error("Error deleting User Class:", error);
                        });
                    };
                    td4.append(i);
                    tr.append(td4);
                }
                listClass.append(tr);
            });
        });
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
                    if (document.getElementById(docu2.id + "toU") != null) return;
                    if (document.getElementById(moduleId + "addM") != null) {
                        document.getElementById(moduleId + "addM").remove();
                        console.log("Suppression de l'option");
                    }
                    const data2 = docu2.data();
                    let a = document.createElement('a');
                    a.innerText = global.getModuleName(data2);
                    let tr = document.createElement('tr');
                    tr.id = docu2.id + "courseL";
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
                    if (role == global.roleAdmin) {
                        let td4 = document.createElement('td');
                        let i = document.createElement('i');
                        i.classList.add("fas", "fa-trash-alt");
                        i.onclick = function () {
                            deleteParticipant(profileId, moduleId);
                        };
                        td4.append(i);
                        tr.append(td4);
                    }
                    listCourses.append(tr);
                    if (++count == size) resolve();
                });
            });
        });
    });
}

function deleteParticipant(userId, moduleId) {
    if (window.confirm("Are you sure you want to delete this user from this module?") == false) return;
    global.deleteModuleUser(moduleId, userId).then(() => {
        console.log('User module deleted');
        document.getElementById(moduleId + "toU").remove();
        getDoc(doc(global.moduleRef, moduleId)).then((docu) => {
            addModuleToSelect(global.getModuleName(docu.data()), moduleId);
        });
    }).catch((error) => {
        console.error('Error deleting Exam:', error);
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
        user_id: profileId,
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


editUserForm.addEventListener('submit', (e) => {
    e.preventDefault();
    let name = editUserForm.name.value;
    let role = roleSelect.options[roleSelect.selectedIndex].value;
    let data = {
        name: name,
        role: role
    };
    updateDoc(userProfile, data).then(() => {
        console.log("User updated");
    }).catch((error) => {
        console.error("Error updating user: ", error);
    });
    window.editUser.close();
});


editUserFormU.addEventListener('submit', (e) => {
    e.preventDefault();
    let name = editUserFormU.name.value;
    let email = editUserFormU.email.value;
    let data = {
        full_name: name,
        email: email
    };
    updatePassword(user, editUserFormU.password.value).then(() => {
        console.log("Mot de passe mis à jour avec succès !");
        updateEmail(user, email).then(() => {
            updateDoc(userProfile, data).then(() => {
                console.log("User updated");
                editUserFormU.reset();
                window.editUserU.close();
            }).catch((error) => {
                console.error("Error updating user: ", error);
            });
        });
    }).catch(function (error) {
        if (error.code === "auth/requires-recent-login") {
            console.log("Vous devez vous reconnecter pour effectuer cette action.");
            window.location.replace("login.html");
        } else {
            console.error("Erreur lors de la mise à jour du mot de passe :", error);
        }
    });
    window.editUser.close();
});

// *-------------------------------------------------------------------------------* //
// *-------------------------- Add Class to Select ----------------------------* //
// *-------------------------------------------------------------------------------* //

function addClassSelect() {
    onSnapshot(global.classRef, (querySnapshot) => {
        querySnapshot.forEach((doc) => {
            if (document.getElementById(doc.id + "toC") != null) return;
            addClassToSelect(global.getClassName(doc.data()), doc.id);
        });
    });
}


let selectClass = document.getElementById('selectClassAdd');
function addClassToSelect(name, key) {
    if (document.getElementById(key + "addC")) return;
    const option = document.createElement("option");
    option.value = name;
    option.text = name;
    option.id = key + "addC";
    selectClass.appendChild(option);
}

let formAddClass = document.querySelector('.add-class');
formAddClass.addEventListener('submit', (e) => {
    e.preventDefault();
    if (selectClass.selectedIndex == -1) return;
    let classId = selectClass.options[selectClass.selectedIndex].id.slice(0, -4);
    addDoc(global.userclassRef, {
        class_id: classId,
        user_id: profileId,
    })
        .then(() => {
            console.log('Class added to user');
            document.getElementById(classId + "addC").remove();
        })
        .catch((error) => {
            console.error('Error adding Class:', error);
        });
    formAddClass.reset();
    window.addClass.close();
});



// *-------------------------------------------------------------------------------* //
// *-------------------------------------------------------------------------------* //
// *----------------------- AUTHENTIFICATIONS -------------------------------* //
// *-------------------------------------------------------------------------------* //
// *-------------------------------------------------------------------------------* //


onAuthStateChanged(auth, (_user) => {
    //AuthChanges(user);
    if (_user == null) {
        window.location.replace("login.html");
        return;
    }
    else {
        user = _user;
        const userQuery = query(global.userRef, where(global.userId, '==', _user.uid));
        console.log("User logged in", _user.uid);
        onSnapshot(userQuery, (querySnapshot) => {
            querySnapshot.forEach((docu) => {
                role = global.getUserRole(docu.data());
                global.navButton(profile, docu.id, document.querySelector('.dropdown-toggle'), document.querySelector('.dropdown'), document.querySelector(".logout"), auth, false);
                if (role == global.roleFaculty) {
                    global.showCourses(document.querySelector(".nav-extend"), document.querySelector(".toggle-all"), "./courses.html", "My Courses", false);
                    if (docu.id == profileId) {
                        editUserButton.onclick = () => {
                            window.editUserU.showModal()
                        };
                        editUserButton.addEventListener('click', () => {
                            getDoc(userProfile).then((docu2) => {
                                console.log(docu2);
                                let docuData = docu2.data();
                                editUserFormU.name.value = global.getUserName(docuData);
                                editUserFormU.email.value = global.getUserEmail(docuData);
                            });
                        });
                    }
                    else {
                        document.querySelector(".admin-header-course").innerText = "Courses taken";
                        editUserButton.remove();
                    }
                    addUserDetails();
                    addCourses();
                    addClass();
                    getDoc(userProfile).then((docu2) => {
                        if (global.getUserRole(docu2.data()) == global.roleFaculty) {
                            document.querySelector(".list-class").remove();
                        }
                        else {
                            addClass();
                        }
                    });
                    document.body.style.display = "block";
                    console.log("faculty");
                }
                else if (role == global.roleStudent) {
                    global.showCourses(document.querySelector(".nav-extend"), document.querySelector(".toggle-all"), "./courses.html", "My Courses", false);
                    if (docu.id != profileId) {
                        getDoc(userProfile).then((docProfile) => {
                            if (global.getUserRole(docProfile.data()) != global.roleFaculty) {
                                window.location.replace("dashboard.html");
                            }
                            else {
                                document.querySelector(".admin-header-course").innerText = "Courses taken";
                            }
                        });
                    }

                    editUserButton.onclick = () => {
                        window.editUserU.showModal()
                    };
                    editUserButton.addEventListener('click', () => {
                        getDoc(userProfile).then((docu2) => {
                            console.log(docu2);
                            let docuData = docu2.data();
                            editUserFormU.name.value = global.getUserName(docuData);
                            editUserFormU.email.value = global.getUserEmail(docuData);
                        });
                    });
                    addUserDetails();
                    addCourses();
                    getDoc(userProfile).then((docu2) => {
                        if (global.getUserRole(docu2.data()) == global.roleFaculty) {
                            document.querySelector(".list-class").remove();
                        }
                        else {
                            addClass();
                        }
                    });
                    document.body.style.display = "block";
                    console.log("student");
                }
                else {
                    let th = document.createElement('th');
                    th.innerText = "Delete";
                    document.getElementById("tr-modules").append(th);
                    let th2 = document.createElement('th');
                    th2.innerText = "Delete";
                    document.getElementById("tr-class").append(th2);
                    document.getElementById("h2-profile").innerHTML += `<i class="fas fa-trash-alt delete-object" id="delete-user"></i>`

                    const buttonDeleteUser = document.getElementById('delete-user')
                    buttonDeleteUser.addEventListener('click', (e) => {
                        e.preventDefault();

                        if (window.confirm("Are you sure you want to delete this user?") == false) return;
                        global.deleteUser(profileId).then(() => {
                            console.log('User deleted');
                            window.location.replace("./dashboard.html");
                        }).catch((error) => {
                            console.error('Error deleting Module:', error);
                        });
                    });

                    document.getElementById('head-class').innerHTML += `<div class="add-button" onclick="window.addClass.showModal()"><i class="fa fa-plus py-2 mr-3"></i>
                    </div>`

                    document.getElementById('head-course').innerHTML += `<div class="add-button" onclick="window.addModule.showModal()"><i class="fa fa-plus py-2 mr-3"></i>
                    </div>`
                    editUserButton = document.getElementById('editButtonUser');
                    editUserButton.addEventListener('click', () => {
                        getDoc(userProfile).then((docu2) => {
                            let docuData = docu2.data();
                            editUserForm.name.value = global.getUserName(docuData);
                            if (global.getUserRole(docuData) == global.roleFaculty) {
                                roleSelect.options[1].selected = true;
                            }
                            else {
                                roleSelect.options[0].selected = true;
                            }
                        });
                    });
                    document.querySelector(".admin-header-course").innerText = "Courses taken";
                    addUserDetails();
                    addCourses().then(() => {
                        addModules();
                        getDoc(userProfile).then((docu2) => {
                            if (global.getUserRole(docu2.data()) == global.roleFaculty) {
                                document.querySelector(".list-class").remove();
                            }
                            else {
                                addClass();
                                addClassSelect();
                            }
                        });
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

