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
    query, where, onSnapshot, updateDoc, deleteField, FieldValue
} from 'firebase/firestore';

import * as global from "./global.js";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDh4Hfogm5owW-g1PBv2ClffErwz7g88D8",
    authDomain: "poofinal-54e26.firebaseapp.com",
    projectId: "poofinal-54e26",
    storageBucket: "poofinal-54e26.appspot.com",
    messagingSenderId: "295749420687",
    appId: "1:295749420687:web:95abbe1f9ff4c0fc5d52fa"
};

// Auth
const auth = getAuth();

// Elements

// Forms
const loginForm = document.querySelector('.login'); // Login form
const loginAdminForm = document.querySelector('.login-admin'); // Login Admin form
const passwordResetform = document.querySelector('.resetPassword'); // Reset password form

// *------------------------------------------------* //
// *------------------------------------------------* //
// *----------------- Functions --------------------* //
// *------------------------------------------------* //
// *-----------------------------------------------* //

// *-----------------------------------------------* //
// *------------------ Log in ---------------------* //
// *-----------------------------------------------* //



// Log in form event listener

loginForm.addEventListener('submit', (e) => {
    e.preventDefault()

    const email = loginForm.email.value;
    const password = loginForm.password.value
    signInWithEmailAndPassword(auth, email, password)
        .then((cred) => {
            const userQuery = query(global.userRef, where(global.userId, "==", cred.user.uid));
            onSnapshot(userQuery, (querySnapshot) => {
                if (querySnapshot.size === 0) {
                    auth.currentUser.delete().then(() => {
                        console.log('User deleted successfully');
                    });
                    loginForm.reset()
                }
                else {
                    console.log('user logged in User: ', cred.user)
                    console.log('user logged in Email: ', cred.user.email)
                    loginForm.reset()
                    window.location.replace("dashboard.html");
                }
            });

        })
        .catch((err) => {
            console.log("This user doesn't exists", err.message)
            checkFakeUser(email, password);
        })
})

function checkFakeUser(email, password) {
    const fakeQuery = query(global.userRef, where(global.userId, "==", "fakeId"));
    onSnapshot(fakeQuery, (querySnapshot) => {
        querySnapshot.forEach((docu) => {
            if (docu.data().email === email && docu.data().password == password) {
                createUserWithEmailAndPassword(auth, email, docu.data().password).then((cred) => {
                    console.log('user logged in: ', cred.user)
                    console.log('Fake user found ', docu.data().email)
                    updateDoc(docu.ref, {
                        user_id: cred.user.uid,
                        password: deleteField()
                    }).then(() => {
                        console.log('Password deleted successfully');
                        window.location.replace("dashboard.html");
                    }).catch((error) => {
                        console.error('Error deleting password:', error);
                    });
                });
            }
        });
    });
}

// Admin login form event listener

loginAdminForm.addEventListener('submit', (e) => {
    e.preventDefault()

    const email = "admin@gmail.com"
    const password = loginAdminForm.password.value

    signInWithEmailAndPassword(auth, email, password)
        .then((cred) => {
            console.log('admin logged in: ', cred.user)
            loginAdminForm.reset()
            window.location.replace("dashboard.html");
            console.log('admin logged in: ', cred.user.email)
        })
        .catch((err) => {
            console.log(err.message)
        })
})

// *-----------------------------------------------* //
// *--------------- Reset Password -----------------* //
// *-----------------------------------------------* //

// Reset password function

let forgotPassword = () => {
    sendPasswordResetEmail(auth, passwordResetform.email.value).then(() => {
        alert('Password reset email sent!');
    }).catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        console.log("This user doesn't exists", errorCode)
    });
    window.resetPassword.close();
}

// Reset password form event listener 

passwordResetform.addEventListener('submit', (e) => {
    e.preventDefault();
    forgotPassword();
});