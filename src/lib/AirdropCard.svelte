<script lang="ts">
  import { env } from "$env/dynamic/public";
  import { FileDropzone } from "@skeletonlabs/skeleton";

  export let airdropFiles: any;
  let message = "";
  let success = true;
  const reader = new FileReader();

  async function onChangeHandler(e: Event): Promise<void> {
    //setMessage("");
    message = "";
    let file = e.target.files[0];
    const fileType = file["type"];
    const validImageTypes = ["text/csv"];
    if (validImageTypes.includes(fileType)) {
      airdropFiles = file;
      success = true;
      const x = reader.readAsText(file);
      console.log(x);
    } else {
      success = false;
      message = "only images accepted";
    }
  }
</script>

<style lang="postcss">
  figure {
    @apply flex relative flex-col;
  }
  figure img,
  .img-bg {
    @apply w-64 h-64 md:w-80 md:h-80;
  }
  .img-bg {
    @apply absolute z-[-1] rounded-full blur-[50px] transition-all;
    animation: pulse 5s cubic-bezier(0, 0, 0, 0.5) infinite,
      glow 5s linear infinite;
  }
  body {
    border-color: #66afe9 !important;
  }
</style>
