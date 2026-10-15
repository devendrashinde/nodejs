(function() {
    'use strict';

    const API = '/api/people';
    const BATCH_SIZE = 25;
    const GROUP_PAGE_SIZE = 24;
    const FACE_PREVIEW_LIMIT = 8;
    const elements = {
        back: document.getElementById('back-button'),
        scan: document.getElementById('scan-button'),
        scanLabel: document.getElementById('scan-label'),
        scanScope: document.getElementById('scan-scope'),
        referenceSection: document.getElementById('reference-section'),
        referencePhotoInfo: document.getElementById('reference-photo-info'),
        scanReference: document.getElementById('scan-reference-button'),
        referenceTagControls: document.getElementById('reference-tag-controls'),
        referenceFaces: document.getElementById('reference-faces'),
        status: document.getElementById('status'),
        progress: document.getElementById('scan-progress'),
        progressLabel: document.getElementById('scan-progress-label'),
        peopleCount: document.getElementById('people-count'),
        peopleList: document.getElementById('people-list'),
        suggestionsCount: document.getElementById('suggestion-count'),
        suggestionsList: document.getElementById('suggestion-list'),
        threshold: document.getElementById('similarity-threshold'),
        thresholdValue: document.getElementById('similarity-value'),
        truncated: document.getElementById('truncated-note'),
        showMore: document.getElementById('show-more'),
        nameOptions: document.getElementById('person-name-options'),
        matchesSection: document.getElementById('person-match-section'),
        matchesCount: document.getElementById('person-match-count'),
        matchesList: document.getElementById('person-match-list')
    };

    let human = null;
    const selectedAlbumPath = new URLSearchParams(globalThis.location.search).get('album');
    const returnAlbumValue = new URLSearchParams(globalThis.location.search).get('returnAlbum');
    const returnAlbumPath = (returnAlbumValue || selectedAlbumPath || '').replaceAll('\\', '/');
    const referencePhotoValue = new URLSearchParams(globalThis.location.search).get('referencePhotoId');
    const referencePhotoId = /^[1-9]\d*$/.test(referencePhotoValue || '') ? Number(referencePhotoValue) : null;
    let groups = [];
    let groupPage = 1;
    let suggestionData = null;
    let referenceTag = '';

    const request = async (url, options) => {
        const response = await fetch(url, options);
        const result = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(result.error || `Request failed (${response.status}).`);
        return result;
    };

    const post = (url, body) => request(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });

    const setStatus = (message, isError) => {
        elements.status.textContent = message;
        elements.status.classList.toggle('text-danger', Boolean(isError));
    };

    const createElement = (tag, className, text) => {
        const element = document.createElement(tag);
        if (className) element.className = className;
        if (text !== undefined) element.textContent = text;
        return element;
    };

    const loadHuman = async () => {
        if (human) return human;
        if (!globalThis.Human?.Human) throw new Error('The local face model did not load. Refresh and try again.');
        const config = {
            modelBasePath: '/face-models/',
            debug: false,
            face: {
                enabled: true,
                detector: { enabled: true, rotation: true, maxDetected: 10 },
                mesh: { enabled: true },
                description: { enabled: true }
            },
            body: { enabled: false },
            hand: { enabled: false },
            object: { enabled: false },
            segmentation: { enabled: false },
            gesture: { enabled: false }
        };
        human = new globalThis.Human.Human({ ...config, backend: 'webgl' });
        try {
            await human.load();
        } catch (webglError) {
            console.warn('WebGL face inference unavailable; falling back to CPU.', webglError.message);
            human = new globalThis.Human.Human({ ...config, backend: 'cpu' });
            await human.load();
        }
        return human;
    };

    const loadImage = (url) => new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error('The image could not be opened.'));
        image.src = url;
    });

    const scanImage = async (photo) => {
        const image = await loadImage(photo.imageUrl);
        const result = await human.detect(image);
        const faces = (result.face || []).filter(face => face.embedding?.length >= 32 && face.box?.length === 4 && face.faceScore >= 0.4)
            .slice(0, 20)
            .map(face => ({
                embedding: Array.from(face.embedding),
                box: Array.from(face.box, Number),
                confidence: Math.max(0, Math.min(1, Number(face.faceScore)))
            }));
        return { photoId: photo.id, faces };
    };

    const saveBatch = async (scans) => {
        if (!scans.length) return 0;
        const result = await post(`${API}/faces`, { scans });
        return result.saved || 0;
    };

    const scanLibrary = async () => {
        elements.scan.disabled = true;
        elements.progress.value = 0;
        elements.progressLabel.textContent = '';
        let cursor = 0;
        let scanned = 0;
        let failed = 0;
        let saveBatchItems = [];
        try {
            setStatus('Loading local face model...', false);
            await loadHuman();
            setStatus(selectedAlbumPath ? `Scanning unprocessed photos in ${selectedAlbumPath}...` : 'Scanning unprocessed photos...', false);

            while (true) {
                const scanUrl = new URL(`${API}/photos`, globalThis.location.origin);
                scanUrl.searchParams.set('afterId', cursor);
                if (selectedAlbumPath) scanUrl.searchParams.set('album', selectedAlbumPath);
                const response = await request(scanUrl.toString());
                const photos = response.photos || [];
                if (!photos.length) break;

                for (let index = 0; index < photos.length; index += 1) {
                    const photo = photos[index];
                    cursor = Math.max(cursor, photo.id);
                    try {
                        saveBatchItems.push(await scanImage(photo));
                    } catch (error) {
                        failed += 1;
                        console.warn(`Face scan skipped ${photo.name}:`, error.message);
                    }
                    scanned += 1;
                    elements.progress.value = Math.round(((index + 1) / photos.length) * 100);
                    elements.progressLabel.textContent = `${scanned} checked · ${failed} skipped`;
                    if (saveBatchItems.length === BATCH_SIZE) {
                        await saveBatch(saveBatchItems);
                        saveBatchItems = [];
                    }
                }
                if (saveBatchItems.length) {
                    await saveBatch(saveBatchItems);
                    saveBatchItems = [];
                }
            }

            setStatus(`Scan complete. ${scanned} photos checked; ${failed} could not be scanned.`, failed > 0);
            await loadGroups();
        } catch (error) {
            setStatus(error.message, true);
        } finally {
            elements.scan.disabled = false;
            if (scanned) elements.progress.value = 100;
        }
    };

    const faceTile = (face, canUnassign) => {
        const tile = createElement('div', 'face-tile');
        const canvas = createElement('canvas', 'face-crop');
        canvas.width = 172;
        canvas.height = 172;
        canvas.setAttribute('aria-label', `${face.name}, ${face.album}`);
        tile.append(canvas);

        const caption = createElement('span', 'face-caption', face.name);
        caption.title = `${face.name} · ${face.album}`;
        tile.append(caption);
        if (canUnassign) {
            const remove = createElement('button', 'btn btn-sm btn-outline-secondary w-100 mt-1', 'Unassign');
            remove.type = 'button';
            remove.addEventListener('click', async () => {
                remove.disabled = true;
                try {
                    await post(`${API}/faces/${face.id}/unassign`, {});
                    await loadGroups();
                } catch (error) {
                    setStatus(error.message, true);
                    remove.disabled = false;
                }
            });
            tile.append(remove);
        }

        const image = new Image();
        image.onload = () => {
            const [x, y, width, height] = face.box.map(Number);
            const paddingX = width * 0.25;
            const paddingY = height * 0.25;
            const left = Math.max(0, x - paddingX);
            const top = Math.max(0, y - paddingY);
            const right = Math.min(image.naturalWidth, x + width + paddingX);
            const bottom = Math.min(image.naturalHeight, y + height + paddingY);
            const context = canvas.getContext('2d');
            context.drawImage(image, left, top, right - left, bottom - top, 0, 0, canvas.width, canvas.height);
        };
        image.onerror = () => {
            const context = canvas.getContext('2d');
            context.fillStyle = '#e4eae6';
            context.fillRect(0, 0, canvas.width, canvas.height);
        };
        image.src = face.imageUrl;
        return tile;
    };

    const renderFaceStrip = (container, faces, canUnassign) => {
        const strip = createElement('div', 'face-strip');
        faces.slice(0, FACE_PREVIEW_LIMIT).forEach(face => strip.append(faceTile(face, canUnassign)));
        container.append(strip);
        if (faces.length > FACE_PREVIEW_LIMIT) {
            container.append(createElement('span', 'group-meta', `${faces.length - FACE_PREVIEW_LIMIT} more faces`));
        }
    };

    const renderPeople = (people) => {
        elements.peopleList.replaceChildren();
        elements.peopleCount.textContent = `${people.length}`;
        people.forEach(person => {
            const card = createElement('article', 'person-group');
            const heading = createElement('div', 'group-title-row');
            heading.append(createElement('h3', 'group-title', person.name));
            heading.append(createElement('span', 'group-meta', `${person.faceCount} faces · ${person.photoCount} photos`));
            card.append(heading);

            const split = createElement('button', 'btn btn-sm btn-outline-warning mt-2', 'Split group');
            split.type = 'button';
            split.addEventListener('click', async () => {
                if (!globalThis.confirm(`Unassign all ${person.faceCount} faces from ${person.name}?`)) return;
                split.disabled = true;
                try {
                    await post(`${API}/${person.id}/unassign`, {});
                    setStatus(`Released ${person.faceCount} faces to suggestions.`, false);
                    await loadGroups();
                } catch (error) {
                    setStatus(error.message, true);
                    split.disabled = false;
                }
            });
            card.append(split);

            const search = createElement('a', 'btn btn-sm btn-outline-primary', 'Find photos');
            search.href = `/?q=${encodeURIComponent(person.name)}`;
            card.append(search);
            renderFaceStrip(card, person.faces || [], true);
            elements.peopleList.append(card);
        });
        if (!people.length) elements.peopleList.append(createElement('p', 'text-muted', 'No named people yet.'));
    };

    const assignGroup = async (group, input, button) => {
        const personName = input.value.trim();
        if (!personName) {
            input.focus();
            return;
        }
        button.disabled = true;
        try {
            await post(`${API}/assign`, { personName, faceIds: group.faces.map(face => face.id) });
            setStatus(`Assigned ${group.faces.length} faces to ${personName}.`, false);
            await loadGroups();
        } catch (error) {
            setStatus(error.message, true);
            button.disabled = false;
        }
    };

    const renderSuggestions = () => {
        const visibleGroups = groups.slice(0, groupPage * GROUP_PAGE_SIZE);
        elements.suggestionsList.replaceChildren();
        elements.suggestionsCount.textContent = `${groups.length} groups · ${suggestionData?.unassignedFaceCount || 0} faces`;
        elements.truncated.hidden = !suggestionData?.truncated;
        elements.showMore.hidden = visibleGroups.length >= groups.length;
        visibleGroups.forEach((group, index) => {
            const card = createElement('article', 'person-group suggestion-group');
            const heading = createElement('div', 'group-title-row');
            heading.append(createElement('h3', 'group-title', `Group ${index + 1}`));
            heading.append(createElement('span', 'group-meta', `${group.faces.length} faces`));
            card.append(heading);
            renderFaceStrip(card, group.faces, false);

            const actions = createElement('div', 'group-actions');
            const input = createElement('input', 'form-control form-control-sm');
            input.type = 'text';
            input.maxLength = 100;
            input.placeholder = 'Person name';
            input.setAttribute('list', 'person-name-options');
            input.setAttribute('aria-label', `Name for group ${index + 1}`);
            const assign = createElement('button', 'btn btn-sm btn-success', 'Assign');
            assign.type = 'button';
            assign.addEventListener('click', () => assignGroup(group, input, assign));
            actions.append(input, assign);
            card.append(actions);
            elements.suggestionsList.append(card);
        });
    };

    const assignSingleFace = async (faceId, personName, button) => {
        button.disabled = true;
        try {
            await post(`${API}/assign`, { personName, faceIds: [faceId] });
            setStatus(`Confirmed match for ${personName}.`, false);
            await loadGroups();
            if (referencePhotoId) await loadReference();
        } catch (error) {
            setStatus(error.message, true);
            button.disabled = false;
        }
    };

    const renderPersonMatches = (data) => {
        const matches = data.personMatches || [];
        const hasNamedPeople = data.people.some(person => person.faceCount > 0);
        elements.matchesSection.hidden = !hasNamedPeople;
        elements.matchesCount.textContent = `${matches.length} candidates`;
        elements.matchesList.replaceChildren();
        if (!matches.length && hasNamedPeople) {
            elements.matchesList.append(createElement('p', 'text-muted', 'No close matches found.'));
            return;
        }

        matches.slice(0, 24).forEach(match => {
            const card = createElement('article', 'person-group suggestion-group');
            const heading = createElement('div', 'group-title-row');
            heading.append(createElement('h3', 'group-title', match.personName));
            heading.append(createElement('span', 'group-meta', `${Math.round(match.similarity * 100)}% match`));
            card.append(heading);
            renderFaceStrip(card, [match], false);
            const confirm = createElement('button', 'btn btn-sm btn-success', `Assign to ${match.personName}`);
            confirm.type = 'button';
            confirm.addEventListener('click', () => assignSingleFace(match.id, match.personName, confirm));
            card.append(confirm);
            elements.matchesList.append(card);
        });
    };

    const renderReference = (data) => {
        elements.referenceSection.hidden = false;
        elements.referencePhotoInfo.textContent = `${data.photo.name} · ${data.photo.album} · Tags: ${data.tags.join(', ') || 'none'}`;
        elements.referenceTagControls.replaceChildren();
        elements.referenceFaces.replaceChildren();
        elements.scanReference.hidden = data.scanned;
        elements.scanReference.disabled = false;

        if (!data.tags.length) {
            elements.referenceTagControls.append(createElement('p', 'text-muted', 'This photo has no tags to use as a person name.'));
        }

        let select = null;
        if (data.tags.length) {
            const label = createElement('label', 'form-label', 'Person tag');
            select = createElement('select', 'form-select form-select-sm');
            select.setAttribute('aria-label', 'Person tag from reference photo');
            data.tags.forEach(tag => {
                const option = document.createElement('option');
                option.value = tag;
                option.textContent = tag;
                select.append(option);
            });
            if (data.tags.includes(referenceTag)) select.value = referenceTag;
            else referenceTag = data.tags[0];
            select.addEventListener('change', () => { referenceTag = select.value; });
            label.append(select);
            elements.referenceTagControls.append(label);
        }

        if (!data.scanned) {
            elements.referenceFaces.append(createElement('p', 'text-muted', 'Scan this photo to choose its face.'));
            return;
        }
        if (!data.faces.length) {
            elements.referenceFaces.append(createElement('p', 'text-muted', 'No faces were detected in this photo.'));
            return;
        }

        data.faces.forEach(face => {
            const card = faceTile({ ...face, name: data.photo.name, album: data.photo.album, imageUrl: data.photo.imageUrl }, false);
            if (face.personName?.toLowerCase() === referenceTag.toLowerCase()) {
                card.append(createElement('span', 'group-meta', `Already linked to ${face.personName}`));
            } else {
                const useFace = createElement('button', 'btn btn-sm btn-outline-primary mt-2', 'Use this face');
                useFace.type = 'button';
                useFace.disabled = !referenceTag || Boolean(face.personName);
                useFace.title = face.personName ? `Already linked to ${face.personName}` : 'Link this face to the selected photo tag';
                useFace.addEventListener('click', async () => {
                    useFace.disabled = true;
                    try {
                        await post(`${API}/reference`, { faceId: face.id, tag: referenceTag });
                        setStatus(`Linked this face to ${referenceTag}.`, false);
                        await loadReference();
                        await loadGroups();
                    } catch (error) {
                        setStatus(error.message, true);
                        useFace.disabled = false;
                    }
                });
                card.append(useFace);
            }
            elements.referenceFaces.append(card);
        });
    };

    const loadReference = async () => {
        if (!referencePhotoId) return;
        const data = await request(`${API}/reference/${referencePhotoId}`);
        renderReference(data);
    };

    const scanReferencePhoto = async () => {
        elements.scanReference.disabled = true;
        try {
            setStatus('Loading local face model...', false);
            await loadHuman();
            const response = await request(`${API}/photos?photoId=${referencePhotoId}`);
            const photo = response.photos?.[0];
            if (!photo) {
                await loadReference();
                return;
            }
            await saveBatch([await scanImage(photo)]);
            setStatus('Reference photo scanned.', false);
            await loadReference();
            await loadGroups();
        } catch (error) {
            setStatus(error.message, true);
        } finally {
            elements.scanReference.disabled = false;
        }
    };

    const loadGroups = async () => {
        const threshold = Number(elements.threshold.value);
        const data = await request(`${API}?threshold=${threshold}`);
        suggestionData = data;
        groups = data.suggestions || [];
        groupPage = 1;
        elements.nameOptions.replaceChildren();
        data.people.forEach(person => {
            const option = document.createElement('option');
            option.value = person.name;
            elements.nameOptions.append(option);
        });

        renderPeople(data.people);
        renderSuggestions();
        renderPersonMatches(data);
        if (!elements.scan.disabled) {
            setStatus(`${data.scannedPhotos} photos scanned · ${data.unassignedFaceCount} unassigned faces`, false);
        }
    };

    elements.scan.addEventListener('click', scanLibrary);
    elements.scanReference.addEventListener('click', scanReferencePhoto);
    elements.threshold.addEventListener('input', () => {
        elements.thresholdValue.value = Number(elements.threshold.value).toFixed(2);
    });
    elements.threshold.addEventListener('change', () => loadGroups().catch(error => setStatus(error.message, true)));
    elements.showMore.addEventListener('click', () => {
        groupPage += 1;
        renderSuggestions();
    });

    if (selectedAlbumPath) {
        elements.scanLabel.textContent = 'Scan this album';
        elements.scanScope.textContent = `Album: ${selectedAlbumPath}`;
        elements.scanScope.hidden = false;
    }

    if (returnAlbumPath && !returnAlbumPath.split('/').some(segment => !segment || segment === '.' || segment === '..' || segment.includes(':'))) {
        elements.back.href = `/?albumPath=${encodeURIComponent(returnAlbumPath)}`;
    }

    if (referencePhotoId) {
        elements.scan.hidden = true;
        elements.referenceSection.hidden = false;
    }

    loadGroups().catch(error => setStatus(error.message, true));
    loadReference().catch(error => setStatus(error.message, true));
}());