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


const listCourses = document.getElementById('list-courses');
const listExams = document.getElementById('list-exams');

const selectFaculty = document.getElementById('selectFaculty');

// *-------------------------------------------------------------------------------* //
// *-------------------------- Profile ----------------------------* //
// *-------------------------------------------------------------------------------* //

const profile = document.getElementById('profile');


// *-------------------------------------------------------------------------------* //
// *-------------------------- Create a new module ----------------------------* //
// *-------------------------------------------------------------------------------* //
formCreateModule.addEventListener('submit', (e) => {
    e.preventDefault();
    let faculty = selectFaculty.options[selectFaculty.selectedIndex].id.slice(0, -4);
    addDoc(global.moduleRef, {
        name: formCreateModule.name.value,
        faculty_id: faculty,
        description: formCreateModule.description.value,
    })
        .then((docu) => {
            addDoc(global.usermoduleRef, {
                user_id: faculty,
                module_id: docu.id,
            })
                .then(() => {
                    console.log('UserModule added');
                })
                .catch((error) => {
                    console.error('Error adding usermodule:', error);
                });
        })
        .catch((error) => {
            console.error('Error adding module:', error);
        });
    formCreateModule.reset();
    window.addModule.close();
});



// *-------------------------------------------------------------------------------* //
// *-------------------------- List Teachers ----------------------------* //
// *-------------------------------------------------------------------------------* //

function addUserToList() {
    onSnapshot(global.userRef, (querySnapshot) => {
        querySnapshot.forEach((docu) => {
            if (document.getElementById(docu.id + "user")) return;
            const ddata = docu.data();
            let roleUser = global.getUserRole(ddata);
            if (roleUser == global.roleAdmin) return;
            if (roleUser == global.roleFaculty) {
                addFacultyToSelect(global.getUserName(ddata), docu.id);
            }
            let tr = document.createElement('tr');
            let a = document.createElement('a');
            let td = document.createElement('td');
            let td2 = document.createElement('td');
            td2.innerText = roleUser;
            a.innerText = global.getUserName(ddata);
            a.href = "./profile.html?id=" + docu.id;
            td.append(a);
            tr.append(td, td2);
            tr.id = docu.id + "user";
            listTeachers.appendChild(tr);
            console.log("User added");
        });
    });
}

// *-------------------------------------------------------------------------------* //
// *-------------------------- Add Modules to list all----------------------------* //
// *-------------------------------------------------------------------------------* //

function addModulesToListd(ddata, docu) {
    if (document.getElementById(docu.id + "module")) return;
    let div = document.createElement('div');
    div.classList.add("card");
    div.id = docu.id + "module";

    let a1 = document.createElement('a');
    a1.href = "module.html?id=" + docu.id + "&type=course";
    let img = document.createElement('img');
    img.classList.add("card-img-top");
    img.src = "../../assets/img/module_card.png";
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
// *-------------------------- List Modules for admin ----------------------------* //
// *-------------------------------------------------------------------------------* //

function addModulesToListAdmin() {
    onSnapshot(global.moduleRef, (querySnapshot) => {
        querySnapshot.forEach((docu) => {
            addModulesToListd(docu.data(), docu)
        });
    });
}

// *-------------------------------------------------------------------------------* //
// *-------------------------- Add User ----------------------------* //
// *-------------------------------------------------------------------------------* //

const formAddUser = document.querySelector('.add-user');

formAddUser.addEventListener('submit', (e) => {
    e.preventDefault();
    addDoc(global.userRef, {
        full_name: formAddUser.name.value,
        email: formAddUser.email.value,
        role: formAddUser.role.value,
        user_id: "fakeId",
        password: formAddUser.password.value
    })
        .then(() => {
            console.log('User added');
        })
        .catch((error) => {
            console.error('Error adding user:', error);
        });
    formAddUser.reset();
    window.addUser.close();
})

let selectCoursesDays = document.getElementById('courses-days');

selectCoursesDays.addEventListener('change', (e) => {
    listCourses.innerHTML = "";
    addCourses();
});

let selectExamsDays = document.getElementById('exams-days');
selectExamsDays.addEventListener('change', (e) => {
    listExams.innerHTML = "";
    addCourses();
});

let selectCoursesOrder = document.getElementById('courses-orderby');
selectCoursesOrder.addEventListener('change', (e) => {
    listCourses.innerHTML = "";
    addCourses();
});

let selectExamsOrder = document.getElementById('exams-orderby');
selectExamsOrder.addEventListener('change', (e) => {
    listExams.innerHTML = "";
    addCourses();
});
// *-------------------------------------------------------------------------------* //
// *-------------------------- Add Next Courses ----------------------------* //
// *-------------------------------------------------------------------------------* //

function addCourses() {
    let days = selectCoursesDays.options[selectCoursesDays.selectedIndex].value;
    let order = selectCoursesOrder.options[selectCoursesOrder.selectedIndex].value;
    console.log("Order: ", order);
    console.log("Days: ", days);
    let listDates = [];
    let listExamsDates = [];
    const userModuleQuery = query(global.usermoduleRef, where(global.usermoduleUserId, "==", userId));
    onSnapshot(userModuleQuery, (querySnapshot) => {
        querySnapshot.forEach((docu2) => {
            let moduleId = global.getUserModuleId(docu2.data());
            const courseQuery = query(global.courseRef, where(global.courseModule, '==', moduleId));
            onSnapshot(courseQuery, (querySnapshot) => {
                querySnapshot.forEach((docu) => {
                    const ddata = docu.data();
                    let card = document.createElement('div');
                    card.classList.add("card-object");
                    let h6 = document.createElement('h6');
                    let name = "";
                    getDoc(doc(global.moduleRef, moduleId)).then((docu3) => {
                        addExams(moduleId, listExamsDates);
                        if (document.getElementById(docu.id + "course")) {
                            console.log("Course already exists");
                            return;
                        }
                        name = global.getModuleName(docu3.data());
                        let h4_1 = document.createElement('h4');
                        let h4_2 = document.createElement('h4');
                        let h3 = document.createElement('h3');
                        let date = global.getCourseStartDate(ddata).toDate()
                        if (date < new Date()) {
                            return;
                        }
                        if (days == "All" || global.datesDiff(date, new Date()) <= days) {
                            let date2 = global.getCourseEndDate(ddata).toDate()
                            // Usage
                            if (global.isSameDay(date2, date)) {
                                h3.innerText = name + " - " + date.toLocaleDateString('en-GB', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                }) + ', ' + date.toLocaleTimeString('en-GB', {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                }) + " ► " + date2.toLocaleTimeString('en-GB', {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                });
                            }
                            else {
                                h3.innerText = name + " - " + date.toLocaleDateString('en-GB', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                }) + ', ' + date.toLocaleTimeString('en-GB', {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                }) + " ► " + date2.toLocaleDateString('en-GB', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                }) + ', ' + date2.toLocaleTimeString('en-GB', {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                });
                            }
                            h4_2.innerText = "Description: " + global.getCourseDescription(ddata);
                            card.append(h6, h3, h4_1, h4_2);
                            card.id = docu.id + "course";

                            if (order == "Date") {
                                listDates.push({ date: date, element: card });
                                listDates.sort((a, b) => a.date - b.date);
                                let index = listDates.findIndex(item => item.element === card && item.date === date);
                                if (index + 1 == listDates.length) {
                                    listCourses.appendChild(card);
                                }
                                else {
                                    listCourses.insertBefore(card, listDates[index + 1].element);
                                }
                            }
                            else {
                                listCourses.appendChild(card);
                            }
                        };
                    });
                });
            });

        });
    });
}

// *-------------------------------------------------------------------------------* //
// *-------------------------- Add Next Exams ----------------------------* //
// *-------------------------------------------------------------------------------* //


function addExams(moduleId, listExamsDates) {
    let days = selectExamsDays.options[selectExamsDays.selectedIndex].value;
    let orderby = selectExamsOrder.options[selectExamsOrder.selectedIndex].value;
    const examQuery = query(global.examRef, where(global.courseModule, '==', moduleId));
    onSnapshot(examQuery, (querySnapshot) => {
        querySnapshot.forEach((docu) => {
            if (document.getElementById(docu.id + "exam")) {
                return;
            }

            const ddata = docu.data();
            let card = document.createElement('div');
            card.classList.add("card-object");
            let h4_1 = document.createElement('h4');
            let h4_2 = document.createElement('h4');
            let a = document.createElement('a');

            let date = global.getExamDate(ddata).toDate()
            if (days == "All" || global.datesDiff(date, new Date()) <= days) {
                h4_1.innerHTML = `<i class="icon fa fa-clock-o fa-fw "></i>` + date.toLocaleDateString('en-GB', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
                a.innerHTML = `<i class="icon fa fa-graduation-cap fa-fw"></i>` + " " + global.getExamName(ddata);
                a.href = "exam.html?id=" + docu.id + "&type=exam";
                let description = global.getExamDescription(ddata);
                if (description.length > 100) {
                    description = description.substring(0, 100) + "...";
                }
                h4_2.innerHTML = `<i class="icon fa fa-align-left fa-fw "></i>` + " " + description;
                card.append(a, h4_1, h4_2);
                card.id = docu.id + "exam";
                listExams.appendChild(card);

                if (orderby == "Date") {
                    listExamsDates.push({ date: date, element: card });
                    listExamsDates.sort((a, b) => a.date - b.date);
                    let index = listExamsDates.findIndex(item => item.element === card && item.date === date);
                    if (index + 1 == listExamsDates.length) {
                        listExams.appendChild(card);
                    }
                    else {
                        listExams.insertBefore(card, listExamsDates[index + 1].element);
                    }
                }
                else {
                    listExams.appendChild(card);
                }
            };
        });
    });
}

// *-------------------------------------------------------------------------------* //
// *-------------------------- Add Faculty to Select ----------------------------* //
// *-------------------------------------------------------------------------------* //

function addFacultyToSelect(name, key) {
    if (document.getElementById(key + "addF")) return;
    const option = document.createElement('option');
    option.value = name;
    option.text = name;
    option.id = key + "addF";
    selectFaculty.appendChild(option);
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
let role = "null";


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
                role = global.getUserRole(docu.data());
                global.navButton(profile, userId, document.querySelector('.dropdown-toggle'), document.querySelector('.dropdown'), document.querySelector(".logout"), auth, role == global.roleAdmin);
                if (role == global.roleStudent || role == global.roleFaculty) {
                    document.querySelector(".ext-courses").style.display = "block";
                    document.querySelector(".container-exams").style.display = "block";
                    global.showCourses(document.querySelector(".nav-extend"), document.querySelector(".toggle-all"), "./courses.html", "My Courses", false);
                    addCourses();
                    console.log("student or faculty");
                }
                else {
                    console.log("admin");
                    document.querySelector(".table-container").style.display = "block";
                    document.querySelector(".modules-ui").style.display = "block";
                    document.querySelector(".modules-header").innerHTML += `<div class="addModuleButton add-button" id="add-module" onclick="window.addModule.showModal()"><i
                    class="fa fa-plus py-2 mr-3"></i></div>`
                    addUserToList();
                    addModulesToListAdmin();
                }
                document.body.style.display = "block";
            });
        }, (error) => {
            window.location.replace("login.html");
        });
    }
});

const user = auth.currentUser;