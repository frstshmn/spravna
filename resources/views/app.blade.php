<!DOCTYPE html>
<html lang="uk">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Maystr</title>
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css" crossorigin="anonymous">
<link rel="stylesheet" href="/css/maystr.css">
</head>
<body>

<!-- Pre-loader (shown before Vue mounts) -->
<div id="pre-loader">
    <div class="loader-spinner"></div>
    <span class="loader-text">MAYSTR</span>
</div>

<!-- Mount point — Vue renders the full app shell via string template in maystr-app.js -->
<div id="app"></div>

<!-- Vendor scripts (local copies — no Node.js required) -->
<script src="/js/vendor/vue.global.prod.js"></script>
<script src="/js/vendor/axios.min.js"></script>
<script src="/js/vendor/chart.umd.min.js"></script>

<!-- App scripts -->
<script src="/js/maystr-core.js"></script>
<script src="/js/maystr-pages.js"></script>
<script src="/js/maystr-app.js"></script>

</body>
</html>
