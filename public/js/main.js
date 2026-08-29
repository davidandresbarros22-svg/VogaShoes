document.addEventListener('DOMContentLoaded', function() {

  // Mobile Menu Toggle
  const menuToggle = document.getElementById('menuToggle');
  const mainNav = document.getElementById('mainNav');

  if (menuToggle && mainNav) {
    menuToggle.addEventListener('click', function() {
      mainNav.classList.toggle('open');
      menuToggle.classList.toggle('open');
    });

    document.addEventListener('click', function(e) {
      if (!menuToggle.contains(e.target) && !mainNav.contains(e.target)) {
        mainNav.classList.remove('open');
        menuToggle.classList.remove('open');
      }
    });
  }

  // Hero Slider
  const slider = document.getElementById('heroSlider');
  if (slider) {
    const slides = slider.querySelectorAll('.hero-slide');
    const dots = slider.querySelectorAll('.dot');
    const prevBtn = document.getElementById('sliderPrev');
    const nextBtn = document.getElementById('sliderNext');
    let currentSlide = 0;
    let interval;

    function showSlide(index) {
      if (index < 0) index = slides.length - 1;
      if (index >= slides.length) index = 0;
      slides.forEach(function(s, i) {
        s.classList.toggle('active', i === index);
      });
      if (dots.length) {
        dots.forEach(function(d, i) {
          d.classList.toggle('active', i === index);
        });
      }
      currentSlide = index;
    }

    function nextSlide() { showSlide(currentSlide + 1); }
    function prevSlide() { showSlide(currentSlide - 1); }

    function startAutoSlide() {
      stopAutoSlide();
      if (slides.length > 1) {
        interval = setInterval(nextSlide, 5000);
      }
    }

    function stopAutoSlide() {
      if (interval) {
        clearInterval(interval);
        interval = null;
      }
    }

    if (prevBtn) prevBtn.addEventListener('click', function() { stopAutoSlide(); prevSlide(); startAutoSlide(); });
    if (nextBtn) nextBtn.addEventListener('click', function() { stopAutoSlide(); nextSlide(); startAutoSlide(); });

    if (dots.length) {
      dots.forEach(function(dot) {
        dot.addEventListener('click', function() {
          stopAutoSlide();
          showSlide(parseInt(this.getAttribute('data-index')));
          startAutoSlide();
        });
      });
    }

    startAutoSlide();
  }

  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(function(anchor) {
    anchor.addEventListener('click', function(e) {
      const href = this.getAttribute('href');
      if (href !== '#') {
        const target = document.querySelector(href);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: 'smooth' });
        }
      }
    });
  });

});
