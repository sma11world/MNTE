<script lang="ts">
  import { FileDropzone } from "@skeletonlabs/skeleton";
  export let data: any;
  export let files;

  $: filteredList = files;
  let message = "";
  let success = false;

  function onChangeHandler(e: Event): void {
    //setMessage("");
    message = "";
    let file = e.target.files[0];
    const fileType = file["type"];
    const validImageTypes = ["image/gif", "image/jpeg", "image/png"];
    if (validImageTypes.includes(fileType)) {
      files = [...files, file];
      success = true;
      console.log(files);
    } else {
      message = "only images accepted";
    }
  }

  const removeImage = (name: string) => {
    files = files.filter((x: any) => x.name !== name);
  };
</script>

<div class="card p-4 mt-12 resize-none">
  <p>Create</p>
  <br />
  <p>{message}</p>
  <FileDropzone name="files" on:change={onChangeHandler}>
    <!-- <svelte:fragment slot="lead">(icon)</svelte:fragment> -->
    <svelte:fragment slot="message">Upload Here</svelte:fragment>
    <svelte:fragment slot="meta"
      >"image/gif", "image/jpeg", "image/png"</svelte:fragment
    >
  </FileDropzone>
  <br />
  {#each files as file}
    <div class="w-full h-16 flex items-center justify-between rounded p-3">
      <div class="flex flex-row items-center gap-2">
        <div class="h-12 w-12">
          <img class="w-full h-full rounded" src={URL.createObjectURL(file)} />
        </div>
        <span class="truncate w-44">{file.name}</span>
      </div>
      <div
        on:click={() => {
          console.log("HERE");
          removeImage(file.name);
        }}
        class="h-6 w-6 bg-red-400 flex items-center cursor-pointer justify-center rounded-sm"
      >
        X
      </div>
    </div>
  {/each}
  <!-- <button
    class="btn variant-filled-surface input-group"
    disabled={files.length <= 0}
    on:click={upload}>Upload</button
  > -->
</div>

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
</style>
