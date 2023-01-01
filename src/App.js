import { useCallback, useContext, useEffect, useState } from "react"
import { UserContext } from "./UserContext"
import { Login } from "./Login";
import { Register } from "./Register";
import { Chat } from "./Chat";
import "./styles.css";
import { useCookies } from "react-cookie";

function App() {
    const [activeForm, setActiveForm] = useState("login");
    const [userContext, setUserContext] = useContext(UserContext);
    const [cookies, setCookie] = useCookies(["refreshToken"]);

    const toggle_login_register = (formName) => {
        setActiveForm(formName);
    }

    const verifyUser = useCallback(() => {
        fetch(process.env.REACT_APP_API_ENDPOINT +"/user/refreshToken", {
            method: "POST",
            withCredentials: true,
            credentials: "include",
            headers: { "Content-Type": "application/json",
                        'Authorization': `Bearer ${cookies.refreshToken}` },
        }).then(async response => {
            if (response.ok) {
                const auth = response.headers.get('Authorization');
                const newToken = auth.split(" ")[1]
                //setToken(newToken)
                //localStorage.setItem("refreshToken", newToken);
                setCookie("refreshToken", newToken, {path: "/"});
                const data = await response.json()
                setUserContext(oldValues => {
                    return { ...oldValues, token: data.token }
                })
            } else {
                setUserContext(oldValues => {
                    return { ...oldValues, token: null }
                })
            }
            // call refreshToken every 5 minutes to renew the authentication token.
            //setTimeout(verifyUser, 1 * 60 * 1000)
        })
    }, [setUserContext])

    useEffect(() => {
        verifyUser()
    }, [verifyUser])

    // Sync logout across tabs
    const syncLogout = useCallback(event => {
        if (event.key === "logout") {
            window.location.reload()
        }
    }, [])

    useEffect(() => {
        window.addEventListener("storage", syncLogout)
        return () => {
            window.removeEventListener("storage", syncLogout)
        }
    }, [syncLogout])

    const handleToken = (token) => {
        //setToken(token);
        //localStorage.setItem("refreshToken", token);
        setCookie("refreshToken", token, {path: "/"});
    }

    return userContext.token === null ? (
        <div id="login_register_div">
            {
                activeForm === "login" ? <Login switchForm={toggle_login_register} refToken={handleToken} /> : <Register switchForm={toggle_login_register} refToken={handleToken} />
            }
        </div>
    ) : userContext.token ? (
        <Chat token={cookies.refreshToken} />
    ) : (
        <div id="login_register_div">
            {
                activeForm === "login" ? <Login switchForm={toggle_login_register} refToken={handleToken} /> : <Register switchForm={toggle_login_register} refToken={handleToken} />
            }
        </div>
    )
}

export default App;