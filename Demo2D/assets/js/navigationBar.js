let navbar = `
    <div class="navigationBar">
        <nav class="navMenu">
            <a href="FireIncidentMap.html">Map</a>
            <a href="FireIncidentStats.html">Stats</a>
            <div class="dot"></div>
        </nav>
    </div>

    <style>
    .navigationBar {
        font-family: "Montserrat", sans-serif;
        background-color: #fddc3a82;
        padding: 15px;
        height: fit-content;
        width: 1400px;
        border-radius: 5px;
    }

    .navMenu a {
        color: #000000;
        text-decoration: none;
        font-size: 1.2em;
        text-transform: uppercase;
        font-weight: 500;
        display: inline-block;
        width: 80px;
        -webkit-transition: all 0.2s ease-in-out;
        transition: all 0.2s ease-in-out;
        text-align: center;
    }

    .navMenu a:hover {
        color: #d4b82a;
    }
    
    .navMenu .dot {
        width: 6px;
        height: 6px;
        background: #d4b82a;
        border-radius: 50%;
        opacity: 0;
        -webkit-transform: translateX(30px);
        transform: translateX(30px);
        -webkit-transition: all 0.2s ease-in-out;
        transition: all 0.2s ease-in-out;
    }

    .navMenu a:nth-child(1):hover~.dot {
        -webkit-transform: translateX(30px);
        transform: translateX(37px);
        -webkit-transition: all 0.2s ease-in-out;
        transition: all 0.2s ease-in-out;
        opacity: 1;
    }

    .navMenu a:nth-child(2):hover~.dot {
        -webkit-transform: translateX(110px);
        transform: translateX(122px);
        -webkit-transition: all 0.2s ease-in-out;
        transition: all 0.2s ease-in-out;
        opacity: 1;
    }
    </style>
`;

document.getElementById("navbar").innerHTML = navbar;