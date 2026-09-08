import path from 'node:path'

const TEMP_DIR = path.resolve(import.meta.dirname, '../.temp')

interface GitHubTreeItem {
  path: string
  type: 'blob' | 'tree'
  sha: string
  size?: number
  url: string
}

interface GitHubTreeResponse {
  tree: GitHubTreeItem[]
  truncated: boolean
}

async function fetchGitHubTree(
  owner: string,
  repo: string,
  path: string,
): Promise<GitHubTreeItem[]> {
  const url = `https://api.github.com/repos/${owner}/${repo}/git/trees/main?recursive=1`

  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`Failed to fetch repository tree: ${response.status} ${response.statusText}`)
  }

  const data = (await response.json()) as GitHubTreeResponse

  // Filter items that are in the specified path
  const filteredItems = data.tree.filter(
    (item) => item.path.startsWith(path) && item.type === 'blob',
  )

  return filteredItems
}

async function downloadFile(url: string, localPath: string) {
  try {
    // Check if file already exists
    const exists = await Bun.file(localPath).exists()

    if (exists) {
      return { path: localPath, success: true, skipped: true }
    }

    const response = await fetch(url)

    if (!response.ok) {
      return {
        path: localPath,
        success: false,
        error: `HTTP ${response.status}: ${response.statusText}`,
      }
    }

    const content = await response.text()
    await Bun.write(localPath, content)

    return { path: localPath, success: true }
  } catch (error) {
    return {
      path: localPath,
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

async function downloadFilesInBatches(
  items: GitHubTreeItem[],
  owner: string,
  repo: string,
  targetPath: string,
  batchSize = 10,
) {
  const totalFiles = items.length
  let completed = 0
  let failed = 0
  let skipped = 0

  // Process items in batches
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize)

    const downloadPromises = batch.map((item) => {
      const relativePath = item.path.substring(targetPath.length + 1)
      const localPath = path.join(TEMP_DIR, relativePath)
      const fileUrl = `https://raw.githubusercontent.com/${owner}/${repo}/main/${item.path}`

      return downloadFile(fileUrl, localPath)
    })

    // Wait for this batch to complete
    const results = await Promise.allSettled(downloadPromises)

    // Process results
    for (const result of results) {
      if (result.status === 'fulfilled') {
        const downloadResult = result.value
        const relativePath = downloadResult.path.substring(TEMP_DIR.length + 1)

        if (downloadResult.success) {
          if (downloadResult.skipped) {
            skipped += 1
            console.log(
              `⏭ Skipped: ${relativePath} (already exists) (${completed + skipped}/${totalFiles})`,
            )
          } else {
            completed += 1
            console.log(`✓ Downloaded: ${relativePath} (${completed + skipped}/${totalFiles})`)
          }
        } else {
          failed += 1
          console.error(`✗ Failed: ${relativePath} - ${downloadResult.error}`)
        }
      } else {
        failed += 1
        console.error(`✗ Promise rejected: ${result.reason}`)
      }
    }

    // Small delay between batches to be respectful to GitHub's servers
    if (i + batchSize < items.length) {
      await new Promise((resolve) => setTimeout(resolve, 250))
    }
  }

  console.log(`\nDownload complete: ${completed} downloaded, ${skipped} skipped, ${failed} failed`)
}

async function main(): Promise<void> {
  try {
    console.log('Fetching test data from recipe-scrapers repository...')

    const owner = 'hhursev'
    const repo = 'recipe-scrapers'
    const targetPath = 'tests/test_data'

    // Fetch repository tree
    const treeItems = await fetchGitHubTree(owner, repo, targetPath)
    console.log(`Found ${treeItems.length} files in ${targetPath}`)

    await downloadFilesInBatches(treeItems, owner, repo, targetPath)

    console.log('\nAll files downloaded successfully!')
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : String(error))
    process.exit(1)
  }
}

await main()
