document.addEventListener("DOMContentLoaded", function() {
  
  // ========== PAGE LOADER ==========
  const pageLoader = document.getElementById('page-loader');
  if (pageLoader) {
    setTimeout(function() {
      pageLoader.classList.add('loaded');
    }, 800);
  }

  // ========== NAVIGATION ==========
  const hamburger = document.getElementById("hamburger");
  const navLinks = document.getElementById("nav-links");
  const navbar = document.getElementById("navbar");

  if (hamburger && navLinks) {
    hamburger.addEventListener("click", function(e) {
      e.preventDefault();
      e.stopPropagation();
      hamburger.classList.toggle("active");
      navLinks.classList.toggle("active");
    });
    
    // Close menu when clicking a link
    navLinks.querySelectorAll("a").forEach(function(link) {
      link.addEventListener("click", function() {
        hamburger.classList.remove("active");
        navLinks.classList.remove("active");
      });
    });

    // Close menu when clicking outside
    document.addEventListener("click", function(e) {
      if (!hamburger.contains(e.target) && !navLinks.contains(e.target)) {
        hamburger.classList.remove("active");
        navLinks.classList.remove("active");
      }
    });
  }

  // ========== SCROLL EFFECTS ==========
  let lastScroll = 0;
  
  window.addEventListener("scroll", function() {
    const currentScroll = window.pageYOffset;
    
    // Navbar scroll effect
    if (navbar) {
      if (currentScroll > 50) {
        navbar.classList.add("scrolled");
      } else {
        navbar.classList.remove("scrolled");
      }
    }
    
    // Back to top button
    const backToTop = document.getElementById("back-to-top");
    if (backToTop) {
      if (currentScroll > 500) {
        backToTop.classList.add("visible");
      } else {
        backToTop.classList.remove("visible");
      }
    }
    
    lastScroll = currentScroll;
  });

  // ========== CART FUNCTIONALITY ==========
  const addToCartBtn = document.getElementById('add-to-cart-btn');
  const quantitySelect = document.getElementById('quantity');
  const cartItems = document.getElementById('cart-items');
  const cartTotal = document.getElementById('cart-total');
  const cartEmptyMsg = document.querySelector('.cart-empty');
  const selectedPriceDisplay = document.getElementById('selected-price');
  const cartToggle = document.getElementById("cart-toggle");
  const miniCart = document.getElementById("mini-cart");
  const cartClose = document.getElementById("cart-close");
  const cartOverlay = document.getElementById("cart-overlay");
  const checkoutBtn = document.getElementById("checkout-btn");
  const toast = document.getElementById("toast");

  let cart = [];
  let total = 0;

  // Show toast notification
  function showToast(message) {
    if (toast) {
      const toastMessage = toast.querySelector('.toast-message');
      if (toastMessage && message) {
        toastMessage.textContent = message;
      }
      toast.classList.add('show');
      setTimeout(function() {
        toast.classList.remove('show');
      }, 2500);
    }
  }

  // Update cart display
  function updateCartDisplay() {
    const cartDot = document.getElementById('cart-dot');
    if (cartDot) {
      if (cart.length > 0) {
        cartDot.classList.add('show');
      } else {
        cartDot.classList.remove('show');
      }
    }

    if (cartItems) {
      cartItems.innerHTML = "";
    }

    if (cartEmptyMsg) {
      if (cart.length === 0) {
        cartEmptyMsg.style.display = "block";
      } else {
        cartEmptyMsg.style.display = "none";
      }
    }

    cart.forEach(function(item) {
      const li = document.createElement('li');
      li.classList.add("cart-item");
      li.innerHTML = '<span>' + item.quantityText + '</span><button class="remove-btn" data-id="' + item.id + '" aria-label="Remove item">×</button>';
      if (cartItems) cartItems.appendChild(li);
    });

    if (cartTotal) {
      cartTotal.textContent = total.toFixed(2);
    }

    if (checkoutBtn) {
      if (cart.length > 0) {
        checkoutBtn.disabled = false;
      } else {
        checkoutBtn.disabled = true;
      }
    }
  }

  // Open cart
  function openCart() {
    if (miniCart) miniCart.classList.add("show");
    if (cartOverlay) cartOverlay.classList.add("show");
    document.body.classList.add("cart-open");
  }

  // Close cart
  function closeCart() {
    if (miniCart) miniCart.classList.remove("show");
    if (cartOverlay) cartOverlay.classList.remove("show");
    document.body.classList.remove("cart-open");
  }

  // Add to cart
  if (addToCartBtn && quantitySelect) {
    addToCartBtn.addEventListener('click', function() {
      const quantityText = quantitySelect.options[quantitySelect.selectedIndex].text;
      const price = parseFloat(quantitySelect.value);

      const item = { 
        id: Date.now(), 
        quantityText: quantityText, 
        price: price 
      };

      cart.push(item);
      total += price;
      updateCartDisplay();

      // Button feedback
      addToCartBtn.classList.add('added');
      const btnText = addToCartBtn.querySelector('.btn-text');
      const originalText = btnText ? btnText.textContent : 'Add to Order';
      if (btnText) btnText.textContent = 'Added!';
      
      showToast('Added to cart!');
      
      setTimeout(function() {
        addToCartBtn.classList.remove('added');
        if (btnText) btnText.textContent = originalText;
      }, 1500);

      // Open cart after short delay
      setTimeout(function() {
        openCart();
      }, 300);
    });
  }

  // Remove from cart
  if (cartItems) {
    cartItems.addEventListener("click", function(e) {
      if (e.target.classList.contains("remove-btn")) {
        const id = Number(e.target.dataset.id);
        const item = cart.find(function(i) { return i.id === id; });
        
        if (item) {
          e.target.parentElement.classList.add('removing');
          setTimeout(function() {
            total -= item.price;
            cart = cart.filter(function(i) { return i.id !== id; });
            updateCartDisplay();
          }, 300);
        }
      }
    });
  }

  // Update price display when quantity changes
  if (quantitySelect && selectedPriceDisplay) {
    quantitySelect.addEventListener('change', function() {
      const priceVal = parseFloat(quantitySelect.value).toFixed(2);
      selectedPriceDisplay.textContent = priceVal;
    });
  }

  // Cart toggle button
  if (cartToggle) {
    cartToggle.addEventListener("click", function() {
      if (miniCart && miniCart.classList.contains("show")) {
        closeCart();
      } else {
        openCart();
      }
    });
  }

  // Close cart button
  if (cartClose) {
    cartClose.addEventListener("click", closeCart);
  }

  // Close cart on overlay click
  if (cartOverlay) {
    cartOverlay.addEventListener("click", closeCart);
  }

  // Checkout button
  if (checkoutBtn) {
    checkoutBtn.addEventListener("click", function() {
      if (cart.length > 0) {
        showToast('Thank you! We will contact you shortly.');
        cart = [];
        total = 0;
        updateCartDisplay();
        setTimeout(closeCart, 1000);
      }
    });
  }

  // Initialize cart display
  updateCartDisplay();

  // ========== SMOOTH SCROLLING ==========
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        const navHeight = navbar ? navbar.offsetHeight : 80;
        const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - navHeight;
        
        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });
      }
    });
  });

  // ========== FADE IN ANIMATIONS ==========
  const observerOptions = {
    root: null,
    rootMargin: '0px 0px -50px 0px',
    threshold: 0.1
  };

  const fadeObserver = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        fadeObserver.unobserve(entry.target);
      }
    });
  }, observerOptions);

  document.querySelectorAll('.fade-in').forEach(function(el) {
    fadeObserver.observe(el);
  });

  // ========== FAQ ACCORDION ==========
  const faqDetails = document.querySelectorAll('.faq-item');
  faqDetails.forEach(function(detail) {
    detail.addEventListener('toggle', function() {
      if (this.open) {
        faqDetails.forEach(function(other) {
          if (other !== detail && other.open) {
            other.open = false;
          }
        });
      }
    });
  });

  // ========== GALLERY INTERACTION ==========
  document.querySelectorAll('.gallery-item').forEach(function(item) {
    item.addEventListener('click', function() {
      const img = this.querySelector('img');
      if (img) {
        this.classList.toggle('expanded');
      }
    });
  });

  // ========== KEYBOARD ACCESSIBILITY ==========
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      closeCart();
      if (hamburger) hamburger.classList.remove("active");
      if (navLinks) navLinks.classList.remove("active");
    }
  });

});