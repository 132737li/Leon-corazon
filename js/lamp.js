// ===== Lampe de connexion - Berlly Boutique (lamp.js corrigé) =====
// Nécessite gsap.min.js et Draggable.min.js chargés AVANT ce fichier.
(function () {
  // Vérifications initiales
  const hasGsap = typeof gsap !== "undefined";
  const hasDraggable = typeof Draggable !== "undefined";

  const loginCard = document.querySelector(".auth-card");
  const body = document.body;
  const root = document.documentElement;

  // Si GSAP ou Draggable manquent, on laisse le formulaire visible et on sort proprement
  if (!hasGsap || !hasDraggable) {
    console.error("GSAP ou Draggable non chargé : la lampe reste inactive.");
    if (loginCard) {
      loginCard.style.opacity = 1;
      loginCard.style.visibility = "visible";
    }
    return;
  }

  gsap.registerPlugin(Draggable);

  // Sélecteurs de la lampe (gardez des guards pour éviter les erreurs si éléments manquants)
  const cordBead = document.querySelector(".cord-bead");
  const cordLine = document.querySelector(".cord-line");
  const hitArea = document.querySelector(".cord-hit");
  const clickSoundSrc = "https://assets.codepen.io/605876/click.mp3";

  // État
  let isOn = false;

  // Préparer le son (silencieux si non supporté)
  let clickSound = null;
  try {
    clickSound = new Audio(clickSoundSrc);
    clickSound.preload = "auto";
  } catch (e) {
    clickSound = null;
  }

  // Masquer le formulaire au départ (animation GSAP)
  if (loginCard) {
    gsap.set(loginCard, { autoAlpha: 0, y: 20 });
  }

  // Toggle de la lampe : met à jour dataset, variable CSS et animation du formulaire
  function toggleLamp() {
    isOn = !isOn;

    // jouer son si possible
    if (clickSound) {
      try {
        clickSound.currentTime = 0;
        clickSound.play().catch(() => {});
      } catch (e) {
        // ignore
      }
    }

    // dataset pour styles CSS (body[data-on="true"])
    try {
      body.dataset.on = isOn ? "true" : "false";
      root.style.setProperty("--on", isOn ? 1 : 0);
    } catch (e) {
      // ignore
    }

    // animation du formulaire
    if (loginCard) {
      gsap.to(loginCard, {
        autoAlpha: isOn ? 1 : 0,
        y: isOn ? 0 : 20,
        duration: 0.5,
        ease: "power2.out",
      });

      // focus sur le premier champ du formulaire quand on allume
      if (isOn) {
        const firstInput = loginCard.querySelector("input, button, textarea, select");
        if (firstInput) {
          setTimeout(() => firstInput.focus(), 350);
        }
      }
    }
  }

  // Remet la corde en position initiale (animation élastique)
  function resetCord() {
    if (cordBead) {
      gsap.to(cordBead, { y: 0, duration: 0.6, ease: "elastic.out(1, 0.4)" });
    }
    if (cordLine) {
      try {
        gsap.to(cordLine, {
          attr: { y2: 180 },
          duration: 0.6,
          ease: "elastic.out(1, 0.4)",
        });
      } catch (e) {
        // fallback : rien
      }
    }
  }

  // Si la zone cliquable n'existe pas, on attache un toggle simple sur la carte
  if (!hitArea) {
    if (loginCard) {
      loginCard.style.cursor = "pointer";
      loginCard.addEventListener("click", (e) => {
        const tag = e.target.tagName.toLowerCase();
        if (["input", "button", "textarea", "select", "a"].includes(tag)) return;
        toggleLamp();
      });
      loginCard.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          toggleLamp();
        }
      });
    }
    return;
  }

  // Créer le Draggable sur la zone hitArea
  try {
    Draggable.create(hitArea, {
      type: "y",
      bounds: { minY: 0, maxY: 60 },
      onDrag() {
        if (cordBead) gsap.set(cordBead, { y: this.y });
        if (cordLine) {
          try {
            gsap.set(cordLine, { attr: { y2: 180 + this.y } });
          } catch (e) {
            // ignore si cordLine n'est pas un SVG ou attr non supporté
          }
        }
      },
      onRelease() {
        if (this.y > 30) toggleLamp();
        gsap.set(hitArea, { y: 0 });
        resetCord();
      },
      onClick() {
        toggleLamp();
      },
    });

    // Rendre la hitArea accessible au clavier (Enter/Space)
    hitArea.setAttribute("tabindex", "0");
    hitArea.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        toggleLamp();
      }
    });
  } catch (err) {
    console.error("Erreur lors de la création du Draggable :", err);
    hitArea.addEventListener("click", toggleLamp);
  }
})();
