ChromeUtils.defineESModuleGetters(window, {
    EchelonThemeManager: "chrome://modules/content/EchelonThemeManager.sys.mjs",
    EchelonUpdateChecker: "chrome://userscripts/content/modules/EchelonUpdateChecker.sys.mjs",
});
const { PrefUtils, VersionUtils } = ChromeUtils.import("chrome://userscripts/content/echelon_utils.uc.js");
const gOptionsBundle = document.getElementById("optionsBundle");

let g_themeManager = new EchelonThemeManager;
g_themeManager.init(
    document.documentElement,
    {
        style: true,
        bools: [
            "Echelon.Appearance.Blue",
            "Echelon.Appearance.NewLogo"
        ]
    }
);

document.querySelector(".restart-later-button").addEventListener("click",  function () {
    document.querySelector("[data-modal='restart-needed']").visibility("hide");
});

document.querySelector(".restart-now-button").addEventListener("click",  function () {
    windowRoot.ownerGlobal.UC_API.Runtime.restart(true);
});

const restartPrompt = {
	observe: function (subject, topic, data) {
		if (topic == "nsPref:changed")
			document.querySelector("[data-modal='restart-needed']").visibility("show");
	},
};

Services.prefs.addObserver("Echelon.Option.Branding", restartPrompt, false);
Services.prefs.addObserver("Echelon.Appearance.NewLogo", restartPrompt, false);

function switchCategory(event)
{
    let section = document.getElementById(this.value);
    if (section)
    {
        let selected = document.querySelector(`.section[selected="true"]`);
        selected && selected.removeAttribute("selected");
        section.setAttribute("selected", "true");
    }
}
document.getElementById("categories").addEventListener("select", switchCategory);

const gPrefHandler = {
    updatePref: function PrefHandler_updatePref(element)
    {
        switch (element.localName)
        {
            case "checkbox":
                element.checked = Services.prefs.getBoolPref(
                    element.getAttribute("preference"),
                    false
                );
                break;
            case "radiogroup":
                element.value = Services.prefs.getIntPref(
                    element.getAttribute("preference"),
                    0
                );
                break;
            case "menulist":
				if (element.getAttribute("type") == "string") {
					element.value = Services.prefs.getStringPref(
						element.getAttribute("preference")
					);
				} 
				else {
					element.value = Services.prefs.getIntPref(
						element.getAttribute("preference"),
						0
					);
				}
                break;
            case "echelon-menulist":
                if (element.getAttribute("type") == "string") {
                    element.setAttribute("value", Services.prefs.getStringPref(element.getAttribute("preference")));
                    element.setValue(element.getAttribute("value"));
                } 
                else {
                    element.value = Services.prefs.getIntPref(
                        element.getAttribute("preference"),
                        0
                    );
                }
                break;
            case "input":
                switch (element.type)
                {
                    case "number":
                        element.value = Services.prefs.getIntPref(
                            element.getAttribute("preference"),
                            0
                        );
                        break;
                }
                break;
        }
    },

    handleEvent: function PrefHandler_handleEvent(event)
    {
        switch (event.type)
        {
            case "CheckboxStateChange":
                Services.prefs.setBoolPref(
                    event.target.getAttribute("preference"),
                    event.target.checked
                );
                break;
            case "input":
            {
                let pref = event.target;
                switch (pref.type)
                {
                    case "number":
                        if (pref.value && Number.isInteger(Number(pref.value)))
                        {
                            pref.removeAttribute("invalid");
                            Services.prefs.setIntPref(
                                pref.getAttribute("preference"),
                                Number(pref.value)
                            );
                        }
                        else
                        {
                            pref.setAttribute("invalid", "");
                        }
                        break;
                }
            }
            case "command":
				if (event.target.parentElement.parentElement.getAttribute("type") == "string") {
					Services.prefs.setStringPref(
						event.target.parentElement.parentElement.getAttribute("preference"),
						event.target.parentElement.parentElement.value
					)
				} else {
					Services.prefs.setIntPref(
						event.target.parentElement.parentElement.getAttribute("preference"),
						Number(event.target.parentElement.parentElement.value)
					);
				};
                break;
            case "echelon-menulist-command":
                Services.prefs.setStringPref(
                    event.target.parentElement.parentElement.parentElement.getAttribute("preference"),
                    event.target.parentElement.parentElement.parentElement.getAttribute("value")
                );
                break;
        }
    },

    observe: function PrefHandler_observe(subject, topic, data)
    {
        if (topic == "nsPref:changed")
        {
            let pref = document.querySelector(`[preference="${data}"]`);
            pref && this.updatePref(pref);
        }
    },

    init: function PrefHandler_init()
    {
        for (const pref of document.querySelectorAll("[preference]"))
        {
            this.updatePref(pref);
        }
        Services.prefs.addObserver(null, this);
        document.addEventListener("CheckboxStateChange", this);
        document.addEventListener("input", this);
        document.addEventListener("command", this);
        document.addEventListener("updateRadioGroup", this);

        document.querySelectorAll(".menulist").forEach(menulist => {
            let items = menulist.querySelectorAll(".item");
            
            items.forEach(item => {
                item.addEventListener("echelon-menulist-command", this);
            });
        });
    }
};

gPrefHandler.init();

// stolen from echelon_themes until i add import support on that script
class ThemeUtils
{
    static stylePreset = {
		0: { // Firefox 4
			"version": "4",
            "name": "Firefox 4",
            "year": "2011",
		},
		1: { // Firefox 5
			"version": "5",
            "name": "Firefox 5",
            "year": "2011",
		},
		2: { // Firefox 6
			"version": "6",
            "name": "Firefox 6",
            "year": "2011",
		},
		3: { // Firefox 8
			"version": "8",
            "name": "Firefox 8",
            "year": "2011",
		},
		4: { // Firefox 10
			"version": "10",
            "name": "Firefox 10",
            "year": "2012",
		},
        5: { // Firefox 14
			"version": "14",
            "name": "Firefox 14",
            "year": "2012",
		},
        6: { // Firefox 28
			"version": "28",
            "name": "Firefox 28",
            "year": "2014",
		},
        7: { // Firefox 29
			"version": "29",
            "name": "Firefox 29",
            "year": "2014",
		},
        8: { // Firefox 56
			"version": "56",
            "name": "Firefox 56 (WIP)",
            "year": "2017",
		}
	};

    static styleHomepage = {
		0: { // Firefox 4-7
            "version": "4",
            "name": "Firefox 4",
            "year": "2011",
		},
        1: { // Firefox 10-12
            "version": "8",
            "name": "Firefox 8",
            "year": "2011",
		},
        2: { // Firefox 13-22
            "version": "14",
            "name": "Firefox 14",
            "year": "2012",
		},
        3: { // Firefox 23-30
            "version": "28",
            "name": "Firefox 28",
            "year": "2014",
		},
        4: { // Firefox 23-30
            "version": "56",
            "name": "Firefox 56",
            "year": "2017",
		},
	};
}

let presetContainer = document.getElementById("preset-container");
let presetCard = null;

function buildPresetCards() {
    // clear pre-build cards
    presetContainer.innerHTML = "";

    for (const i of Object.keys(ThemeUtils.stylePreset)) {
        let platform = PrefUtils.tryGetStringPref("Echelon.Appearance.systemStyle") || "win";

        presetCard = `
            <vbox class="card">
                <radio value="${i}" class="card-content">
                    <div class="checked" />
                    <div class="year">${ThemeUtils.stylePreset[i].year}</div>
                    <image class="card-image" style="background-image: url('chrome://userchrome/content/pages/options/images/presets/${platform}/firefox-${ThemeUtils.stylePreset[i].version}.png');" flex="1" />
                    <div class="content">
                        <label value="${ThemeUtils.stylePreset[i].name}" flex="1" />
                    </div>
                </radio>
            </vbox> 
        `

        presetContainer.setAttribute("echelon-system-style", platform);
        presetContainer.appendChild(MozXULElement.parseXULToFragment(presetCard));
    }
}

const rebuildCards = {
	observe: function (subject, topic, data) {
		if (topic == "nsPref:changed")
			buildPresetCards();
	},
};
Services.prefs.addObserver("Echelon.Appearance.systemStyle", rebuildCards, false);
document.addEventListener("DOMContentLoaded", buildPresetCards);

let homepageContainer = document.getElementById("homepage-container");

for (const i of Object.keys(ThemeUtils.styleHomepage)) {
    presetCard = `
        <vbox class="card">
            <radio value="${i}" class="card-content">
                <div class="checked" />
                <div class="year">${ThemeUtils.styleHomepage[i].year}</div>
                <image class="card-image" style="background-size: cover; background-position: center -10px; background-image: url('chrome://userchrome/content/pages/options/images/homepage/firefox-${ThemeUtils.styleHomepage[i].version}.png');" flex="1" />
                <div class="content">
                    <label value="${ThemeUtils.styleHomepage[i].name}" flex="1" />
                </div>
            </radio>
        </vbox> 
    `

    homepageContainer.appendChild(MozXULElement.parseXULToFragment(presetCard));
}

function disableAeroBlue() {
    let systemStyleList = document.querySelector("[preference='Echelon.Appearance.systemStyle']");
    let currentSystemStyle = systemStyleList.getAttribute("value");

    document.querySelector("[preference='Echelon.Appearance.Blue']").removeAttribute("disabled");

    if (currentSystemStyle == "winxp" || currentSystemStyle == "win8" || currentSystemStyle == "win10") {
        document.querySelector("[preference='Echelon.Appearance.Blue']").setAttribute("disabled", "true");
        Services.prefs.setBoolPref(
            document.querySelector("[preference='Echelon.Appearance.Blue']").getAttribute("preference"),
            true
        );
    }
}

function disableStyleExclusiveOptions() {
    for (const i of document.querySelectorAll("[echelon-style-disabled]")) {
        if (PrefUtils.tryGetIntPref("Echelon.Appearance.Style") >= i.getAttribute("echelon-style-disabled")) {
            i.setAttribute("disabled", "true");
        } else {
            i.removeAttribute("disabled");
        }
    }    
}

document.addEventListener("echelon-menulist-command", disableAeroBlue);
document.addEventListener("DOMContentLoaded", disableAeroBlue);

const echelonStyle = {
	observe: function (subject, topic, data) {
		if (topic == "nsPref:changed")
			disableStyleExclusiveOptions();
	},
};
Services.prefs.addObserver("Echelon.Appearance.Style", echelonStyle, false);
document.addEventListener("DOMContentLoaded", disableStyleExclusiveOptions);

async function loadVersion() {
    let localEchelonJSON = await EchelonUpdateChecker.getBuildData("local");
    let updateAvailable = await EchelonUpdateChecker.checkForUpdate();
    let updateString = gOptionsBundle.getString("up_to_date");
    if (localEchelonJSON.channel == "nightly") {
        updateString = gOptionsBundle.getString("up_to_date_nightly");
    }
    let updateStatus = "up_to_date";

	document.querySelectorAll("#version").forEach(async identifier => {
        identifier.value = gOptionsBundle.getFormattedString("version_format", [localEchelonJSON.version]);
	})

    document.querySelectorAll("#build").forEach(async identifier => {
        identifier.value = gOptionsBundle.getFormattedString("build_format", [localEchelonJSON.build]);
	})

    if (updateAvailable) {
        updateString = gOptionsBundle.getString("update_available");
        updateStatus = "available";
    }

    document.querySelector(".about-header-update").innerHTML = updateString;
    document.querySelector(".about-header-info").setAttribute("status", updateStatus);
}
document.addEventListener("DOMContentLoaded", loadVersion);
